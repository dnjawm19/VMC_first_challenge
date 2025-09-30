import type { Hono } from "hono";
import { failure, respond, success, type ErrorResult } from "@/backend/http/response";
import {
  getLogger,
  getSupabase,
  type AppEnv,
  type AppContext,
} from "@/backend/hono/context";
import {
  AdvertiserProfileUpsertRequestSchema,
  InfluencerProfileUpsertRequestSchema,
  SignupRequestSchema,
  type AdvertiserProfileUpsertRequest,
  type InfluencerProfileUpsertRequest,
  type SignupRequest,
} from "@/features/onboarding/backend/schema";
import {
  createSignup,
  getAdvertiserProfile,
  getInfluencerProfile,
  upsertAdvertiserProfile,
  upsertInfluencerProfile,
} from "@/features/onboarding/backend/service";
import {
  onboardingErrorCodes,
  type OnboardingErrorCode,
} from "@/features/onboarding/backend/error";

const extractAccessToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) {
    return null;
  }

  const matches = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  if (!matches) {
    return null;
  }

  return matches[1]?.trim() ?? null;
};

const resolveCurrentUserId = async (c: AppContext) => {
  const supabase = getSupabase(c);
  const token = extractAccessToken(c.req.header("authorization"));

  if (!token) {
    return failure(
      401,
      onboardingErrorCodes.unauthorized,
      "인증이 필요한 요청입니다."
    );
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return failure(
      401,
      onboardingErrorCodes.unauthorized,
      "유효하지 않은 인증 토큰입니다."
    );
  }

  return success({ userId: data.user.id });
};

type RegisterOptions = {
  prefix?: string;
};

const registerSignupRoute = (app: Hono<AppEnv>, { prefix = "" }: RegisterOptions) => {
  const path = `${prefix}/onboarding/signup`;

  app.post(path, async (c) => {
    let payload: SignupRequest;

    try {
      const body = await c.req.json();
      const parsed = SignupRequestSchema.safeParse(body);

      if (!parsed.success) {
        return respond(
          c,
          failure(
            400,
            onboardingErrorCodes.validationError,
            "회원가입 요청 형식이 올바르지 않습니다.",
            parsed.error.format()
          )
        );
      }

      payload = parsed.data;
    } catch (error) {
      return respond(
        c,
        failure(
          400,
          onboardingErrorCodes.validationError,
          "요청 본문을 해석할 수 없습니다.",
          error instanceof Error ? error.message : String(error)
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createSignup(supabase, payload);

    if (!result.ok && result.status >= 500) {
      const errorResult = result as ErrorResult<OnboardingErrorCode, unknown>;
      logger.error("[onboarding/signup] internal error", errorResult.error);
    }

    return respond(c, result);
  });
};

const registerInfluencerRoutes = (
  app: Hono<AppEnv>,
  { prefix = "" }: RegisterOptions
) => {
  const basePath = `${prefix}/onboarding/influencer`;

  app.get(basePath, async (c) => {
    const authResult = await resolveCurrentUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    const supabase = getSupabase(c);
    const result = await getInfluencerProfile(supabase, authResult.data.userId);

    return respond(c, result);
  });

  app.put(basePath, async (c) => {
    const authResult = await resolveCurrentUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    let payload: InfluencerProfileUpsertRequest;

    try {
      const body = await c.req.json();
      const parsed = InfluencerProfileUpsertRequestSchema.safeParse(body);

      if (!parsed.success) {
        return respond(
          c,
          failure(
            400,
            onboardingErrorCodes.validationError,
            "인플루언서 정보가 올바르지 않습니다.",
            parsed.error.format()
          )
        );
      }

      payload = parsed.data;
    } catch (error) {
      return respond(
        c,
        failure(
          400,
          onboardingErrorCodes.validationError,
          "요청 본문을 해석할 수 없습니다.",
          error instanceof Error ? error.message : String(error)
        )
      );
    }

    const supabase = getSupabase(c);
    const result = await upsertInfluencerProfile(
      supabase,
      authResult.data.userId,
      payload
    );

    return respond(c, result);
  });
};

const registerAdvertiserRoutes = (
  app: Hono<AppEnv>,
  { prefix = "" }: RegisterOptions
) => {
  const basePath = `${prefix}/onboarding/advertiser`;

  app.get(basePath, async (c) => {
    const authResult = await resolveCurrentUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    const supabase = getSupabase(c);
    const result = await getAdvertiserProfile(
      supabase,
      authResult.data.userId
    );

    return respond(c, result);
  });

  app.put(basePath, async (c) => {
    const authResult = await resolveCurrentUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    let payload: AdvertiserProfileUpsertRequest;

    try {
      const body = await c.req.json();
      const parsed = AdvertiserProfileUpsertRequestSchema.safeParse(body);

      if (!parsed.success) {
        return respond(
          c,
          failure(
            400,
            onboardingErrorCodes.validationError,
            "광고주 정보가 올바르지 않습니다.",
            parsed.error.format()
          )
        );
      }

      payload = parsed.data;
    } catch (error) {
      return respond(
        c,
        failure(
          400,
          onboardingErrorCodes.validationError,
          "요청 본문을 해석할 수 없습니다.",
          error instanceof Error ? error.message : String(error)
        )
      );
    }

    const supabase = getSupabase(c);
    const result = await upsertAdvertiserProfile(
      supabase,
      authResult.data.userId,
      payload
    );

    return respond(c, result);
  });
};

export const registerOnboardingRoutes = (app: Hono<AppEnv>) => {
  registerSignupRoute(app, { prefix: "" });
  registerSignupRoute(app, { prefix: "/api" });
  registerInfluencerRoutes(app, { prefix: "" });
  registerInfluencerRoutes(app, { prefix: "/api" });
  registerAdvertiserRoutes(app, { prefix: "" });
  registerAdvertiserRoutes(app, { prefix: "/api" });
};
