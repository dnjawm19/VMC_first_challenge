import type { Hono } from 'hono';
import {
  failure,
  respond,
} from '@/backend/http/response';
import {
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  CampaignListQuerySchema,
} from '@/features/campaigns/backend/schema';
import { getCampaigns } from '@/features/campaigns/backend/service';
import { campaignErrorCodes } from '@/features/campaigns/backend/error';

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
};
