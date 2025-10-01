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
  AdvertiserCampaignQuerySchema,
  CampaignCreateRequestSchema,
  CampaignActionRequestSchema,
  CampaignUpdateRequestSchema,
} from '@/features/campaign-management/backend/schema';
import {
  getAdvertiserCampaigns,
  createCampaign,
  getCampaignManagementDetail,
  handleCampaignAction,
  updateCampaign,
  deleteCampaign,
} from '@/features/campaign-management/backend/service';
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

const registerCampaignManagementRoutesWithPrefix = (
  app: Hono<AppEnv>,
  { prefix = '' }: RegisterOptions,
) => {
  const campaignsPath = `${prefix}/advertiser/campaigns`;
  const campaignDetailPath = `${campaignsPath}/:campaignId`;
  const campaignActionPath = `${campaignDetailPath}/actions`;

  app.get(campaignsPath, async (c) => {
    const authResult = await resolveRequiredUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    const queryResult = AdvertiserCampaignQuerySchema.safeParse(c.req.query());

    if (!queryResult.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          '체험단 목록 필터 값이 올바르지 않습니다.',
          queryResult.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await getAdvertiserCampaigns(
      supabase,
      authResult.data.userId,
      queryResult.data,
    );

    return respond(c, result);
  });

  app.post(campaignsPath, async (c) => {
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

    const parsed = CampaignCreateRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          '체험단 정보가 올바르지 않습니다.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await createCampaign(
      supabase,
      authResult.data.userId,
      parsed.data,
    );

    return respond(c, result);
  });

  app.get(campaignDetailPath, async (c) => {
    const authResult = await resolveRequiredUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    const campaignId = c.req.param('campaignId');

    const supabase = getSupabase(c);
    const result = await getCampaignManagementDetail(
      supabase,
      authResult.data.userId,
      campaignId,
    );

    return respond(c, result);
  });

  app.patch(campaignDetailPath, async (c) => {
    const authResult = await resolveRequiredUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    let payload: unknown;

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

    const parsed = CampaignUpdateRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          '체험단 정보가 올바르지 않습니다.',
          parsed.error.format(),
        ),
      );
    }

    const campaignId = c.req.param('campaignId');
    const supabase = getSupabase(c);
    const result = await updateCampaign(
      supabase,
      authResult.data.userId,
      campaignId,
      parsed.data,
    );

    return respond(c, result);
  });

  app.delete(campaignDetailPath, async (c) => {
    const authResult = await resolveRequiredUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    const campaignId = c.req.param('campaignId');
    const supabase = getSupabase(c);
    const result = await deleteCampaign(
      supabase,
      authResult.data.userId,
      campaignId,
    );

    return respond(c, result);
  });

  app.post(campaignActionPath, async (c) => {
    const authResult = await resolveRequiredUserId(c);

    if (!authResult.ok) {
      return respond(c, authResult);
    }

    let payload: unknown;

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

    const parseResult = CampaignActionRequestSchema.safeParse(payload);

    if (!parseResult.success) {
      return respond(
        c,
        failure(
          400,
          campaignErrorCodes.validationError,
          '요청 값이 올바르지 않습니다.',
          parseResult.error.format(),
        ),
      );
    }

    const campaignId = c.req.param('campaignId');
    const supabase = getSupabase(c);
    const result = await handleCampaignAction(
      supabase,
      authResult.data.userId,
      campaignId,
      parseResult.data,
    );

    return respond(c, result);
  });
};

export const registerCampaignManagementRoutes = (app: Hono<AppEnv>) => {
  ['' as const, '/api' as const].forEach((prefix) =>
    registerCampaignManagementRoutesWithPrefix(app, { prefix }),
  );
};
