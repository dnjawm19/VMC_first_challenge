import type { Hono } from 'hono';
import {
  failure,
  respond,
} from '@/backend/http/response';
import {
  getSupabase,
  type AppEnv,
  type AppContext,
} from '@/backend/hono/context';
import {
  CampaignListQuerySchema,
  CampaignIdParamsSchema,
} from '@/features/campaigns/backend/schema';
import { getCampaigns, getCampaignDetail } from '@/features/campaigns/backend/service';
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

export const registerCampaignRoutes = (app: Hono<AppEnv>) => {
  app.get('/campaigns', async (c) => {
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

  app.get('/campaigns/:campaignId', async (c) => {
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
};
