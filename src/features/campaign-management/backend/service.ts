import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  campaignErrorCodes,
  type CampaignErrorCode,
} from '@/features/campaigns/backend/error';
import {
  AdvertiserCampaignListResponseSchema,
  CampaignCreateRequestSchema,
  CampaignCreateResponseSchema,
  type AdvertiserCampaignListResponse,
  type AdvertiserCampaignQuery,
  type CampaignCreateRequest,
  type CampaignCreateResponse,
} from '@/features/campaign-management/backend/schema';
import {
  ADVERTISER_CAMPAIGN_SORT_OPTIONS,
} from '@/features/campaign-management/constants';

const CAMPAIGNS_TABLE = 'campaigns';
const ADVERTISER_PROFILES_TABLE = 'advertiser_profiles';

const mapSortOption = (
  sort: (typeof ADVERTISER_CAMPAIGN_SORT_OPTIONS)[number],
): {
  column: string;
  ascending: boolean;
} => {
  switch (sort) {
    case 'endingSoon':
      return { column: 'recruitment_end_at', ascending: true };
    case 'latest':
    default:
      return { column: 'created_at', ascending: false };
  }
};

const ensureVerifiedAdvertiser = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<{ verified: boolean }, CampaignErrorCode>> => {
  const { data, error } = await client
    .from(ADVERTISER_PROFILES_TABLE)
    .select('verification_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      error.message,
    );
  }

  if (!data) {
    return failure(
      403,
      campaignErrorCodes.validationError,
      '광고주 정보 등록 후 체험단을 관리할 수 있습니다.',
    );
  }

  const verified = data.verification_status === 'verified';

  return success({ verified });
};

export const getAdvertiserCampaigns = async (
  client: SupabaseClient,
  userId: string,
  query: AdvertiserCampaignQuery,
): Promise<
  HandlerResult<AdvertiserCampaignListResponse, CampaignErrorCode, unknown>
> => {
  const advertiserResult = await ensureVerifiedAdvertiser(client, userId);

  if (!advertiserResult.ok) {
    return advertiserResult;
  }

  const { column, ascending } = mapSortOption(query.sort ?? 'latest');

  let request = client
    .from(CAMPAIGNS_TABLE)
    .select(
      'id, title, recruitment_start_at, recruitment_end_at, capacity, benefits, mission, store_info, status, created_at, updated_at',
    )
    .eq('advertiser_user_id', userId)
    .order(column, { ascending, nullsFirst: false });

  if (query.status) {
    request = request.eq('status', query.status);
  }

  const { data, error } = await request;

  if (error) {
    return failure(
      500,
      campaignErrorCodes.fetchFailed,
      error.message,
    );
  }

  const parsed = AdvertiserCampaignListResponseSchema.safeParse({
    items: (data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      recruitmentStartAt: item.recruitment_start_at,
      recruitmentEndAt: item.recruitment_end_at,
      capacity: item.capacity ?? 0,
      benefits: item.benefits,
      mission: item.mission,
      storeInfo: item.store_info,
      status: item.status ?? 'recruiting',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
    meta: {
      verified: advertiserResult.data.verified,
    },
  });

  if (!parsed.success) {
    return failure(
      500,
      campaignErrorCodes.fetchFailed,
      '체험단 목록 응답이 올바르지 않습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

export const createCampaign = async (
  client: SupabaseClient,
  userId: string,
  payload: CampaignCreateRequest,
): Promise<HandlerResult<CampaignCreateResponse, CampaignErrorCode, unknown>> => {
  const advertiserResult = await ensureVerifiedAdvertiser(client, userId);

  if (!advertiserResult.ok) {
    return advertiserResult;
  }

  if (!advertiserResult.data.verified) {
    return failure(
      403,
      campaignErrorCodes.validationError,
      '사업자 검증 완료 후 체험단을 등록할 수 있습니다.',
    );
  }

  const parsed = CampaignCreateRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return failure(
      400,
      campaignErrorCodes.validationError,
      '체험단 정보가 올바르지 않습니다.',
      parsed.error.format(),
    );
  }

  const { data, error } = await client
    .from(CAMPAIGNS_TABLE)
    .insert({
      advertiser_user_id: userId,
      title: parsed.data.title,
      recruitment_start_at: parsed.data.recruitmentStartAt,
      recruitment_end_at: parsed.data.recruitmentEndAt,
      capacity: parsed.data.capacity,
      benefits: parsed.data.benefits,
      mission: parsed.data.mission,
      store_info: parsed.data.storeInfo,
      status: 'recruiting',
      thumbnail_url: parsed.data.thumbnailUrl ?? null,
    })
    .select('id')
    .maybeSingle();

  if (error || !data) {
    return failure(
      500,
      campaignErrorCodes.fetchFailed,
      error?.message ?? '체험단을 생성하지 못했습니다.',
    );
  }

  const parsedResponse = CampaignCreateResponseSchema.safeParse({
    campaignId: data.id,
  });

  if (!parsedResponse.success) {
    return failure(
      500,
      campaignErrorCodes.fetchFailed,
      '체험단 생성 응답이 올바르지 않습니다.',
      parsedResponse.error.format(),
    );
  }

  return success(parsedResponse.data, 201);
};
