import type { SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import {
  onboardingErrorCodes,
  type OnboardingErrorCode,
} from "@/features/onboarding/backend/error";
import {
  SignupResponseSchema,
  type SignupRequest,
  type SignupResponse,
} from "@/features/onboarding/backend/schema";

const USER_PROFILES_TABLE = "user_profiles";
const USER_TERMS_TABLE = "user_terms_acceptances";

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
      email_confirm: true,
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
