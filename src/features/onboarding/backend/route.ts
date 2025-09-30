import type { Hono } from "hono";
import { failure, respond, type ErrorResult } from "@/backend/http/response";
import { getLogger, getSupabase, type AppEnv } from "@/backend/hono/context";
import {
  SignupRequestSchema,
  type SignupRequest,
} from "@/features/onboarding/backend/schema";
import { createSignup } from "@/features/onboarding/backend/service";
import {
  onboardingErrorCodes,
  type OnboardingErrorCode,
} from "@/features/onboarding/backend/error";

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

export const registerOnboardingRoutes = (app: Hono<AppEnv>) => {
  registerSignupRoute(app, { prefix: "" });
  registerSignupRoute(app, { prefix: "/api" });
};
