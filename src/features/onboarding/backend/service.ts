import type { SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import {
  onboardingErrorCodes,
  type OnboardingErrorCode,
} from "@/features/onboarding/backend/error";
import {
  AdvertiserProfileResponseSchema,
  AdvertiserProfileUpsertRequestSchema,
  InfluencerProfileResponseSchema,
  InfluencerProfileUpsertRequestSchema,
  SignupResponseSchema,
  type AdvertiserProfileResponse,
  type AdvertiserProfileUpsertRequest,
  type InfluencerProfileResponse,
  type InfluencerProfileUpsertRequest,
  type SignupRequest,
  type SignupResponse,
} from "@/features/onboarding/backend/schema";
import { validateAndNormalizeChannel } from "@/features/onboarding/lib/channel-validator";
import {
  isValidBusinessNumber,
  normalizeBusinessNumber,
} from "@/features/onboarding/lib/business-number-validator";

const USER_PROFILES_TABLE = "user_profiles";
const USER_TERMS_TABLE = "user_terms_acceptances";
const INFLUENCER_PROFILES_TABLE = "influencer_profiles";
const INFLUENCER_CHANNELS_TABLE = "influencer_channels";
const ADVERTISER_PROFILES_TABLE = "advertiser_profiles";

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
      birth_date: payload.birthDate,
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
    .select("id, channel_type, channel_name, channel_url, status, follower_count")
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
      followerCount: channel.follower_count ?? 0,
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
    followerCount: number;
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
      followerCount: channel.followerCount,
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
          follower_count: channel.followerCount,
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

export const getAdvertiserProfile = async (
  client: SupabaseClient,
  userId: string
): Promise<
  HandlerResult<AdvertiserProfileResponse, OnboardingErrorCode, unknown>
> => {
  const { data, error } = await client
    .from(ADVERTISER_PROFILES_TABLE)
    .select(
      "company_name, address, store_phone, business_registration_number, representative_name, verification_status"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return failure(
      500,
      onboardingErrorCodes.advertiserProfileFetchFailed,
      error.message
    );
  }

  const response = AdvertiserProfileResponseSchema.parse({
    profile: data
      ? {
          companyName: data.company_name,
          address: data.address,
          storePhone: data.store_phone,
          representativeName: data.representative_name,
          businessRegistrationNumber: data.business_registration_number,
          verificationStatus: data.verification_status ?? "pending",
        }
      : null,
  });

  return success(response);
};

export const upsertAdvertiserProfile = async (
  client: SupabaseClient,
  userId: string,
  payload: AdvertiserProfileUpsertRequest
): Promise<
  HandlerResult<AdvertiserProfileResponse, OnboardingErrorCode, unknown>
> => {
  const parsed = AdvertiserProfileUpsertRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return failure(
      400,
      onboardingErrorCodes.validationError,
      "광고주 정보가 올바르지 않습니다.",
      parsed.error.format()
    );
  }

  const normalizedBusinessNumber = normalizeBusinessNumber(
    parsed.data.businessRegistrationNumber
  );
  const normalizedStorePhone = parsed.data.storePhone.replace(/[^0-9]/g, "");

  if (!isValidBusinessNumber(normalizedBusinessNumber)) {
    return failure(
      400,
      onboardingErrorCodes.advertiserBusinessNumberInvalid,
      "유효한 사업자등록번호가 아닙니다."
    );
  }

  const { error } = await client.from(ADVERTISER_PROFILES_TABLE).upsert(
    {
      user_id: userId,
      company_name: parsed.data.companyName,
      address: parsed.data.address,
      store_phone: normalizedStorePhone,
      representative_name: parsed.data.representativeName,
      business_registration_number: normalizedBusinessNumber,
      verification_status: "pending",
    },
    { onConflict: "user_id" }
  );

  if (error) {
    const isDuplicate = error.code === "23505";

    return failure(
      400,
      isDuplicate
        ? onboardingErrorCodes.advertiserBusinessNumberDuplicate
        : onboardingErrorCodes.advertiserProfileUpsertFailed,
      isDuplicate ? "이미 등록된 사업자등록번호입니다." : error.message
    );
  }

  return getAdvertiserProfile(client, userId);
};
