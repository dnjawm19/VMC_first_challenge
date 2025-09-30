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
  CampaignManagementDetailResponseSchema,
  CampaignActionRequestSchema,
  CampaignActionResponseSchema,
  type AdvertiserCampaignListResponse,
  type AdvertiserCampaignQuery,
  type CampaignCreateRequest,
  type CampaignCreateResponse,
  type CampaignManagementDetailResponse,
  type CampaignActionRequest,
  type CampaignActionResponse,
} from '@/features/campaign-management/backend/schema';
import {
  ADVERTISER_CAMPAIGN_SORT_OPTIONS,
} from '@/features/campaign-management/constants';

const CAMPAIGNS_TABLE = 'campaigns';
const ADVERTISER_PROFILES_TABLE = 'advertiser_profiles';
const CAMPAIGN_APPLICATIONS_TABLE = 'campaign_applications';
const USER_PROFILES_TABLE = 'user_profiles';

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

const mapCampaignToDetail = (campaign: {
  id: string;
  title: string;
  recruitment_start_at: string;
  recruitment_end_at: string;
  capacity: number | null;
  benefits: string;
  mission: string;
  store_info: string;
  status: string | null;
  created_at: string;
  updated_at: string;
}) => ({
  id: campaign.id,
  title: campaign.title,
  recruitmentStartAt: campaign.recruitment_start_at,
  recruitmentEndAt: campaign.recruitment_end_at,
  capacity: campaign.capacity ?? 0,
  benefits: campaign.benefits,
  mission: campaign.mission,
  storeInfo: campaign.store_info,
  status: (campaign.status ?? 'recruiting') as (typeof CAMPAIGN_STATUS_OPTIONS)[number],
  createdAt: campaign.created_at,
  updatedAt: campaign.updated_at,
});

const fetchCampaignManagementDetail = async (
  client: SupabaseClient,
  campaignId: string,
  advertiserId: string,
): Promise<
  HandlerResult<CampaignManagementDetailResponse, CampaignErrorCode, unknown>
> => {
  const { data: campaign, error: campaignError } = await client
    .from(CAMPAIGNS_TABLE)
    .select(
      'id, title, recruitment_start_at, recruitment_end_at, capacity, benefits, mission, store_info, status, created_at, updated_at',
    )
    .eq('id', campaignId)
    .eq('advertiser_user_id', advertiserId)
    .maybeSingle();

  if (campaignError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      campaignError.message,
    );
  }

  if (!campaign) {
    return failure(
      404,
      campaignErrorCodes.notFound,
      '요청한 체험단을 찾을 수 없습니다.',
    );
  }

  const { data: applications, error: applicationsError } = await client
    .from(CAMPAIGN_APPLICATIONS_TABLE)
    .select(
      'id, influencer_user_id, status, motivation, visit_plan_date, submitted_at',
    )
    .eq('campaign_id', campaignId)
    .order('submitted_at', { ascending: true });

  if (applicationsError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      applicationsError.message,
    );
  }

  const influencerIds = Array.from(
    new Set((applications ?? []).map((application) => application.influencer_user_id)),
  );

  let profiles: Record<string, string | null> = {};

  if (influencerIds.length > 0) {
    const { data: profileRows, error: profileError } = await client
      .from(USER_PROFILES_TABLE)
      .select('user_id, full_name')
      .in('user_id', influencerIds);

    if (profileError) {
      return failure(
        500,
        campaignErrorCodes.detailFetchFailed,
        profileError.message,
      );
    }

    profiles = Object.fromEntries(
      (profileRows ?? []).map((row) => [row.user_id, row.full_name ?? null]),
    );
  }

  const detail = {
    detail: {
      campaign: mapCampaignToDetail(campaign),
      applicants: (applications ?? []).map((application) => ({
        applicationId: application.id,
        influencerId: application.influencer_user_id,
        influencerName: profiles[application.influencer_user_id] ?? null,
        status: (application.status ?? 'applied') as 'applied' | 'selected' | 'rejected',
        motivation: application.motivation ?? null,
        visitPlanDate: application.visit_plan_date,
        submittedAt: application.submitted_at,
      })),
      actions: {
        canCloseRecruitment: (campaign.status ?? 'recruiting') === 'recruiting',
        canSelectApplicants: (campaign.status ?? 'recruiting') === 'closed',
        capacity: campaign.capacity ?? 0,
      },
    },
  } satisfies CampaignManagementDetailResponse;

  const parsed = CampaignManagementDetailResponseSchema.safeParse(detail);

  if (!parsed.success) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      '체험단 상세 응답이 올바르지 않습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
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

export const getCampaignManagementDetail = async (
  client: SupabaseClient,
  userId: string,
  campaignId: string,
): Promise<
  HandlerResult<CampaignManagementDetailResponse, CampaignErrorCode, unknown>
> => {
  const advertiserResult = await ensureVerifiedAdvertiser(client, userId);

  if (!advertiserResult.ok) {
    return advertiserResult;
  }

  return fetchCampaignManagementDetail(client, campaignId, userId);
};

export const handleCampaignAction = async (
  client: SupabaseClient,
  userId: string,
  campaignId: string,
  rawPayload: CampaignActionRequest,
): Promise<HandlerResult<CampaignActionResponse, CampaignErrorCode, unknown>> => {
  const advertiserResult = await ensureVerifiedAdvertiser(client, userId);

  if (!advertiserResult.ok) {
    return advertiserResult;
  }

  const payload = CampaignActionRequestSchema.safeParse(rawPayload);

  if (!payload.success) {
    return failure(
      400,
      campaignErrorCodes.validationError,
      '요청 값이 올바르지 않습니다.',
      payload.error.format(),
    );
  }

  const parsedPayload = payload.data;

  const { data: campaign, error: campaignError } = await client
    .from(CAMPAIGNS_TABLE)
    .select('id, status, capacity')
    .eq('id', campaignId)
    .eq('advertiser_user_id', userId)
    .maybeSingle();

  if (campaignError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      campaignError.message,
    );
  }

  if (!campaign) {
    return failure(
      404,
      campaignErrorCodes.notFound,
      '요청한 체험단을 찾을 수 없습니다.',
    );
  }

  if (parsedPayload.action === 'closeRecruitment') {
    if ((campaign.status ?? 'recruiting') !== 'recruiting') {
      return failure(
        400,
        campaignErrorCodes.validationError,
        '모집중인 체험단만 모집 종료할 수 있습니다.',
      );
    }

    const { error: updateError } = await client
      .from(CAMPAIGNS_TABLE)
      .update({ status: 'closed' })
      .eq('id', campaignId);

    if (updateError) {
      return failure(
        500,
        campaignErrorCodes.detailFetchFailed,
        updateError.message,
      );
    }

    return fetchCampaignManagementDetail(client, campaignId, userId);
  }

  if ((campaign.status ?? 'recruiting') !== 'closed') {
    return failure(
      400,
      campaignErrorCodes.validationError,
      '모집 종료된 체험단만 선정할 수 있습니다.',
    );
  }

  const { data: applicants, error: applicantsError } = await client
    .from(CAMPAIGN_APPLICATIONS_TABLE)
    .select('id')
    .eq('campaign_id', campaignId);

  if (applicantsError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      applicantsError.message,
    );
  }

  const validApplicantIds = new Set(
    (applicants ?? []).map((applicant) => applicant.id),
  );

  const selectedIds = parsedPayload.applicantIds.filter((id) =>
    validApplicantIds.has(id),
  );

  if (selectedIds.length === 0) {
    return failure(
      400,
      campaignErrorCodes.validationError,
      '선정할 지원자를 선택해 주세요.',
    );
  }

  if (campaign.capacity && selectedIds.length > campaign.capacity) {
    return failure(
      400,
      campaignErrorCodes.validationError,
      '선정 인원이 모집 인원을 초과했습니다.',
    );
  }

  const { error: selectError } = await client
    .from(CAMPAIGN_APPLICATIONS_TABLE)
    .update({ status: 'selected' })
    .in('id', selectedIds);

  if (selectError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      selectError.message,
    );
  }

  let rejectError = null;

  if (selectedIds.length > 0) {
    const notInClause = `(${selectedIds.map((id) => `"${id}"`).join(',')})`;
    const { error } = await client
      .from(CAMPAIGN_APPLICATIONS_TABLE)
      .update({ status: 'rejected' })
      .eq('campaign_id', campaignId)
      .not('id', 'in', notInClause);

    rejectError = error;
  }

  if (!rejectError && selectedIds.length === 0) {
    rejectError = null;
  }

  if (rejectError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      rejectError.message,
    );
  }

  const { error: statusUpdateError } = await client
    .from(CAMPAIGNS_TABLE)
    .update({ status: 'selected' })
    .eq('id', campaignId);

  if (statusUpdateError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      statusUpdateError.message,
    );
  }

  return fetchCampaignManagementDetail(client, campaignId, userId);
};
