import type { SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import {
  onboardingErrorCodes,
  type OnboardingErrorCode,
} from "@/features/onboarding/backend/error";
import {
  InfluencerProfileResponseSchema,
  InfluencerProfileUpsertRequestSchema,
  SignupResponseSchema,
  type InfluencerProfileResponse,
  type InfluencerProfileUpsertRequest,
  type SignupRequest,
  type SignupResponse,
} from "@/features/onboarding/backend/schema";
import { validateAndNormalizeChannel } from "@/features/onboarding/lib/channel-validator";

const USER_PROFILES_TABLE = "user_profiles";
const USER_TERMS_TABLE = "user_terms_acceptances";
const INFLUENCER_PROFILES_TABLE = "influencer_profiles";
const INFLUENCER_CHANNELS_TABLE = "influencer_channels";

const rollBackAuthUser = async (client: SupabaseClient, userId: string) => {
  await client.auth.admin.deleteUser(userId);
};

export const createSignup = async (
  client: SupabaseClient,
  payload: SignupRequest
): Promise<HandlerResult<SignupResponse, OnboardingErrorCode, unknown>> => {
  const { data: authData, error: authError } =
    await client.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: false,
      user_metadata: {
        full_name: payload.fullName,
        role: payload.role,
      },
    });

  if (authError || !authData.user) {
    const message = authError?.message ?? "계정 생성에 실패했습니다.";
    const isDuplicate =
      typeof authError?.message === "string" &&
      authError.message.toLowerCase().includes("already registered");

    return failure(
      400,
      isDuplicate
        ? onboardingErrorCodes.duplicateEmail
        : onboardingErrorCodes.authCreationFailed,
      message
    );
  }

  const userId = authData.user.id;
  const normalizedPhone = payload.phone.replace(/[^0-9+]/g, "");

  const { error: profileError } = await client
    .from(USER_PROFILES_TABLE)
    .insert({
      user_id: userId,
      full_name: payload.fullName,
      phone: normalizedPhone,
      role: payload.role,
      auth_method: payload.authMethod,
    });

  if (profileError) {
    await rollBackAuthUser(client, userId);

    return failure(
      500,
      onboardingErrorCodes.profileInsertFailed,
      profileError.message
    );
  }

  if (payload.terms.length > 0) {
    const { error: termsError } = await client.from(USER_TERMS_TABLE).insert(
      payload.terms.map((term) => ({
        user_id: userId,
        terms_code: term.code,
        version: term.version,
      }))
    );

    if (termsError) {
      await rollBackAuthUser(client, userId);

      return failure(
        500,
        onboardingErrorCodes.termsInsertFailed,
        termsError.message
      );
    }
  }

  const requiresEmailVerification =
    authData.user.email_confirmed_at === null ||
    authData.user.email_confirmed_at === undefined;

  const response = SignupResponseSchema.parse({
    userId,
    email: payload.email,
    requiresEmailVerification,
  });

  return success(response, 201);
};

export const getInfluencerProfile = async (
  client: SupabaseClient,
  userId: string
): Promise<
  HandlerResult<InfluencerProfileResponse, OnboardingErrorCode, unknown>
> => {
  const { data: profileData, error: profileError } = await client
    .from(INFLUENCER_PROFILES_TABLE)
    .select("birth_date, age_policy_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return failure(
      500,
      onboardingErrorCodes.influencerProfileFetchFailed,
      profileError.message
    );
  }

  const { data: channelData, error: channelError } = await client
    .from(INFLUENCER_CHANNELS_TABLE)
    .select("id, channel_type, channel_name, channel_url, status")
    .eq("influencer_user_id", userId)
    .order("created_at", { ascending: true });

  if (channelError) {
    return failure(
      500,
      onboardingErrorCodes.influencerChannelFetchFailed,
      channelError.message
    );
  }

  const response = InfluencerProfileResponseSchema.parse({
    profile:
      profileData && profileData.birth_date
        ? {
            birthDate: profileData.birth_date,
            agePolicyStatus: profileData.age_policy_status ?? "pending",
          }
        : null,
    channels: (channelData ?? []).map((channel) => ({
      id: channel.id,
      type: channel.channel_type,
      name: channel.channel_name,
      url: channel.channel_url,
      status: channel.status,
    })),
  });

  return success(response);
};

export const upsertInfluencerProfile = async (
  client: SupabaseClient,
  userId: string,
  payload: InfluencerProfileUpsertRequest
): Promise<
  HandlerResult<InfluencerProfileResponse, OnboardingErrorCode, unknown>
> => {
  const payloadParse = InfluencerProfileUpsertRequestSchema.safeParse(payload);

  if (!payloadParse.success) {
    return failure(
      400,
      onboardingErrorCodes.validationError,
      "인플루언서 정보가 올바르지 않습니다.",
      payloadParse.error.format()
    );
  }

  const normalizedChannels: Array<{
    type: InfluencerProfileUpsertRequest["channels"][number]["type"];
    name: string;
    url: string;
  }> = [];

  for (const channel of payloadParse.data.channels) {
    const normalized = validateAndNormalizeChannel(channel.type, channel.url);

    if (!normalized.ok) {
      return failure(
        400,
        onboardingErrorCodes.influencerChannelInvalid,
        (normalized as { reason: string }).reason
      );
    }

    normalizedChannels.push({
      type: channel.type,
      name: channel.name,
      url: normalized.value.url,
    });
  }

  const { error: profileError } = await client
    .from(INFLUENCER_PROFILES_TABLE)
    .upsert(
      {
        user_id: userId,
        birth_date: payloadParse.data.birthDate,
        age_policy_status: "pending",
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    return failure(
      500,
      onboardingErrorCodes.influencerProfileUpsertFailed,
      profileError.message
    );
  }

  const { error: deleteError } = await client
    .from(INFLUENCER_CHANNELS_TABLE)
    .delete()
    .eq("influencer_user_id", userId);

  if (deleteError) {
    return failure(
      500,
      onboardingErrorCodes.influencerChannelSyncFailed,
      deleteError.message
    );
  }

  if (normalizedChannels.length > 0) {
    const { error: insertError } = await client
      .from(INFLUENCER_CHANNELS_TABLE)
      .insert(
        normalizedChannels.map((channel) => ({
          influencer_user_id: userId,
          channel_type: channel.type,
          channel_name: channel.name,
          channel_url: channel.url,
          status: "pending",
        }))
      );

    if (insertError) {
      return failure(
        500,
        onboardingErrorCodes.influencerChannelSyncFailed,
        insertError.message
      );
    }
  }

  return getInfluencerProfile(client, userId);
};
