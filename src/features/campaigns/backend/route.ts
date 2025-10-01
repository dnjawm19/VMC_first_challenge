import type { Hono } from 'hono';
import {
  failure,
  respond,
  success,
} from '@/backend/http/response';
import {
  getSupabase,
  type AppEnv,
  type AppContext,
} from '@/backend/hono/context';
import {
  CampaignListQuerySchema,
  CampaignIdParamsSchema,
  MyApplicationsQuerySchema,
} from '@/features/campaigns/backend/schema';
import {
  getCampaigns,
  getCampaignDetail,
  applyToCampaign,
  getMyApplications,
} from '@/features/campaigns/backend/service';
import { campaignErrorCodes } from '@/features/campaigns/backend/error';

const extractBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) {
    return null;
  }

  const matches = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  if (!matches) {
    return null;
  }

  return matches[1]?.trim() ?? null;
};

const resolveOptionalUserId = async (c: AppContext) => {
  const token = extractBearerToken(c.req.header('authorization'));

  if (!token) {
    return undefined;
  }

  const supabase = getSupabase(c);
  const { data } = await supabase.auth.getUser(token);

  return data.user?.id;
};

const resolveRequiredUserId = async (c: AppContext) => {
  const token = extractBearerToken(c.req.header('authorization'));

  if (!token) {
    return failure(
      401,
      campaignErrorCodes.validationError,
      '로그인이 필요한 요청입니다.',
    );
  }

  const supabase = getSupabase(c);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return failure(
      401,
      campaignErrorCodes.validationError,
      '유효하지 않은 인증 토큰입니다.',
    );
  }

  return success({ userId: data.user.id });
};

type RegisterOptions = {
  prefix?: string;
};

const registerCampaignRoutesWithPrefix = (
  app: Hono<AppEnv>,
  { prefix = '' }: RegisterOptions,
) => {
  const campaignsPath = `${prefix}/campaigns`;
  const campaignDetailPath = `${campaignsPath}/:campaignId`;
  const campaignApplicationPath = `${campaignDetailPath}/applications`;
  const myApplicationsPath = `${prefix}/me/applications`;

  app.get(campaignsPath, async (c) => {
    const parseResult = CampaignListQuerySchema.safeParse(c.req.query());

    if (!parseResult.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          '캠페인 목록 요청 값이 올바르지 않습니다.',
          parseResult.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await getCampaigns(supabase, parseResult.data);

    return respond(c, result);
  });

  app.get(campaignDetailPath, async (c) => {
    const paramsResult = CampaignIdParamsSchema.safeParse({
      campaignId: c.req.param('campaignId'),
    });

    if (!paramsResult.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          '캠페인 ID 형식이 올바르지 않습니다.',
          paramsResult.error.format(),
        ),
      );
    }

    const currentUserId = await resolveOptionalUserId(c);
    const supabase = getSupabase(c);
    const result = await getCampaignDetail(
      supabase,
      paramsResult.data.campaignId,
      currentUserId,
    );

    return respond(c, result);
  });

  app.post(campaignApplicationPath, async (c) => {
    const paramsResult = CampaignIdParamsSchema.safeParse({
      campaignId: c.req.param('campaignId'),
    });

    if (!paramsResult.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          '캠페인 ID 형식이 올바르지 않습니다.',
          paramsResult.error.format(),
        ),
      );
    }

    const authResult = await resolveRequiredUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    let payload;

    try {
      payload = await c.req.json();
    } catch (error) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          '요청 본문을 해석할 수 없습니다.',
          error instanceof Error ? error.message : String(error),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await applyToCampaign(
      supabase,
      paramsResult.data.campaignId,
      authResult.data.userId,
      payload,
    );

    return respond(c, result);
  });

  app.get(myApplicationsPath, async (c) => {
    const authResult = await resolveRequiredUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    const queryResult = MyApplicationsQuerySchema.safeParse(c.req.query());

    if (!queryResult.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          '지원 목록 필터 값이 올바르지 않습니다.',
          queryResult.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await getMyApplications(
      supabase,
      authResult.data.userId,
      queryResult.data,
    );

    return respond(c, result);
  });
};

export const registerCampaignRoutes = (app: Hono<AppEnv>) => {
  ['' as const, '/api' as const].forEach((prefix) =>
    registerCampaignRoutesWithPrefix(app, { prefix }),
  );
};
