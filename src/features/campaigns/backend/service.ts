import type { SupabaseClient } from "@supabase/supabase-js";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import {
  campaignErrorCodes,
  type CampaignErrorCode,
} from "@/features/campaigns/backend/error";
import {
  CampaignListResponseSchema,
  CampaignDetailResponseSchema,
  CampaignApplicationRequestSchema,
  CampaignApplicationResponseSchema,
  MyApplicationsQuerySchema,
  MyApplicationsResponseSchema,
  type CampaignListQuery,
  type CampaignListResponse,
  type CampaignDetailResponse,
  type CampaignApplicationRequest,
  type CampaignApplicationResponse,
  type MyApplicationsQuery,
  type MyApplicationsResponse,
} from "@/features/campaigns/backend/schema";
import { evaluateCampaignEligibility } from "@/features/campaigns/lib/eligibility";

const CAMPAIGNS_TABLE = "campaigns";
const USER_PROFILES_TABLE = "user_profiles";
const INFLUENCER_PROFILES_TABLE = "influencer_profiles";
const INFLUENCER_CHANNELS_TABLE = "influencer_channels";
const CAMPAIGN_APPLICATIONS_TABLE = "campaign_applications";

const mapSortToOrder = (
  sort: CampaignListQuery["sort"]
): { column: string; ascending: boolean } => {
  switch (sort) {
    case "endingSoon":
      return { column: "recruitment_end_at", ascending: true };
    case "latest":
    default:
      return { column: "created_at", ascending: false };
  }
};

export const getCampaigns = async (
  client: SupabaseClient,
  query: CampaignListQuery
): Promise<HandlerResult<CampaignListResponse, CampaignErrorCode, unknown>> => {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 12;
  const offsetStart = (page - 1) * pageSize;
  const offsetEnd = offsetStart + pageSize - 1;
  const { column, ascending } = mapSortToOrder(query.sort ?? "latest");

  const listQuery = client
    .from(CAMPAIGNS_TABLE)
    .select(
      "id, title, recruitment_start_at, recruitment_end_at, capacity, benefits, mission, store_info, status, thumbnail_url",
      { count: "exact" }
    )
    .order(column, { ascending, nullsFirst: false })
    .range(offsetStart, offsetEnd);

  const { data, error, count } =
    query.status && query.status !== "all"
      ? await listQuery.eq("status", query.status)
      : await listQuery;

  if (error) {
    return failure(500, campaignErrorCodes.fetchFailed, error.message);
  }

  const mapped = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    recruitmentStartAt: row.recruitment_start_at,
    recruitmentEndAt: row.recruitment_end_at,
    capacity: row.capacity ?? 0,
    benefits: row.benefits,
    mission: row.mission,
    storeInfo: row.store_info,
    status: row.status ?? "recruiting",
    thumbnailUrl: row.thumbnail_url ?? undefined,
  }));

  const response = CampaignListResponseSchema.safeParse({
    campaigns: mapped,
    pagination: {
      page,
      pageSize,
      total: count ?? mapped.length,
      hasNextPage: count ? page * pageSize < count : mapped.length === pageSize,
    },
  });

  if (!response.success) {
    return failure(
      500,
      campaignErrorCodes.fetchFailed,
      "캠페인 응답 형식이 올바르지 않습니다.",
      response.error.format()
    );
  }

  return success(response.data);
};

export const getCampaignDetail = async (
  client: SupabaseClient,
  campaignId: string,
  currentUserId?: string
): Promise<
  HandlerResult<CampaignDetailResponse, CampaignErrorCode, unknown>
> => {
  const { data: campaign, error: campaignError } = await client
    .from(CAMPAIGNS_TABLE)
    .select(
      "id, title, recruitment_start_at, recruitment_end_at, capacity, benefits, mission, store_info, status, thumbnail_url, created_at, updated_at"
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      campaignError.message
    );
  }

  if (!campaign) {
    return failure(
      404,
      campaignErrorCodes.notFound,
      "요청한 체험단을 찾을 수 없습니다."
    );
  }

  let userRole: string | null = null;
  let influencerProfileComplete = false;
  let alreadyApplied = false;

  if (currentUserId) {
    const { data: userProfile, error: userProfileError } = await client
      .from(USER_PROFILES_TABLE)
      .select("role")
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (userProfileError) {
      return failure(
        500,
        campaignErrorCodes.detailFetchFailed,
        userProfileError.message
      );
    }

    userRole = userProfile?.role ?? null;

    if (userRole === "influencer") {
      const [
        { data: influencerProfile, error: influencerProfileError },
        { data: channels, error: channelError },
      ] = await Promise.all([
        client
          .from(INFLUENCER_PROFILES_TABLE)
          .select("user_id")
          .eq("user_id", currentUserId)
          .maybeSingle(),
        client
          .from(INFLUENCER_CHANNELS_TABLE)
          .select("id")
          .eq("influencer_user_id", currentUserId),
      ]);

      if (influencerProfileError) {
        return failure(
          500,
          campaignErrorCodes.detailFetchFailed,
          influencerProfileError.message
        );
      }

      if (channelError) {
        return failure(
          500,
          campaignErrorCodes.detailFetchFailed,
          channelError.message
        );
      }

      influencerProfileComplete =
        Boolean(influencerProfile) && (channels?.length ?? 0) > 0;

      if (influencerProfileComplete) {
        const { data: application, error: applicationError } = await client
          .from(CAMPAIGN_APPLICATIONS_TABLE)
          .select("id")
          .eq("campaign_id", campaignId)
          .eq("influencer_user_id", currentUserId)
          .maybeSingle();

        if (applicationError) {
          return failure(
            500,
            campaignErrorCodes.detailFetchFailed,
            applicationError.message
          );
        }

        alreadyApplied = Boolean(application);
      }
    }
  }

  const eligibility = evaluateCampaignEligibility({
    status: campaign.status ?? "recruiting",
    recruitmentEndAt: campaign.recruitment_end_at,
    isLoggedIn: Boolean(currentUserId),
    userRole,
    influencerProfileComplete,
    alreadyApplied,
  });

  const parsed = CampaignDetailResponseSchema.safeParse({
    campaign: {
      id: campaign.id,
      title: campaign.title,
      recruitmentStartAt: campaign.recruitment_start_at,
      recruitmentEndAt: campaign.recruitment_end_at,
      capacity: campaign.capacity ?? 0,
      benefits: campaign.benefits,
      mission: campaign.mission,
      storeInfo: campaign.store_info,
      status: campaign.status ?? "recruiting",
      thumbnailUrl: campaign.thumbnail_url ?? undefined,
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at,
    },
    eligibility,
  });

  if (!parsed.success) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      "캠페인 상세 응답이 올바르지 않습니다.",
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

export const applyToCampaign = async (
  client: SupabaseClient,
  campaignId: string,
  userId: string,
  payload: CampaignApplicationRequest
): Promise<
  HandlerResult<CampaignApplicationResponse, CampaignErrorCode, unknown>
> => {
  const parsedPayload = CampaignApplicationRequestSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return failure(
      400,
      campaignErrorCodes.validationError,
      "체험단 지원 정보가 올바르지 않습니다.",
      parsedPayload.error.format()
    );
  }

  const { data: campaign, error: campaignError } = await client
    .from(CAMPAIGNS_TABLE)
    .select("id, status, recruitment_end_at")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      campaignError.message
    );
  }

  if (!campaign) {
    return failure(
      404,
      campaignErrorCodes.notFound,
      "요청한 체험단을 찾을 수 없습니다."
    );
  }

  if (
    evaluateCampaignEligibility({
      status: campaign.status ?? "recruiting",
      recruitmentEndAt: campaign.recruitment_end_at,
      isLoggedIn: true,
      userRole: "influencer",
      influencerProfileComplete: true,
      alreadyApplied: false,
    }).status === "campaign_closed"
  ) {
    return failure(
      400,
      campaignErrorCodes.detailFetchFailed,
      "모집이 종료된 체험단에는 지원할 수 없습니다."
    );
  }

  const { data: userProfile, error: userProfileError } = await client
    .from(USER_PROFILES_TABLE)
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (userProfileError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      userProfileError.message
    );
  }

  if (!userProfile || userProfile.role !== "influencer") {
    return failure(
      403,
      campaignErrorCodes.validationError,
      "인플루언서 계정만 지원할 수 있습니다."
    );
  }

  const [
    { data: influencerProfile, error: influencerProfileError },
    { data: channels, error: channelError },
  ] = await Promise.all([
    client
      .from(INFLUENCER_PROFILES_TABLE)
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
    client
      .from(INFLUENCER_CHANNELS_TABLE)
      .select("id")
      .eq("influencer_user_id", userId),
  ]);

  if (influencerProfileError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      influencerProfileError.message
    );
  }

  if (channelError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      channelError.message
    );
  }

  const influencerProfileComplete =
    Boolean(influencerProfile) && (channels?.length ?? 0) > 0;

  if (!influencerProfileComplete) {
    return failure(
      403,
      campaignErrorCodes.validationError,
      "인플루언서 프로필과 채널 정보를 먼저 등록해 주세요."
    );
  }

  const { data: existingApplication, error: existingApplicationError } =
    await client
      .from(CAMPAIGN_APPLICATIONS_TABLE)
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("influencer_user_id", userId)
      .maybeSingle();

  if (existingApplicationError) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      existingApplicationError.message
    );
  }

  if (existingApplication) {
    return failure(
      409,
      campaignErrorCodes.validationError,
      "이미 지원한 체험단입니다."
    );
  }

  const { data, error } = await client
    .from(CAMPAIGN_APPLICATIONS_TABLE)
    .insert({
      campaign_id: campaignId,
      influencer_user_id: userId,
      motivation: parsedPayload.data.motivation,
      visit_plan_date: parsedPayload.data.visitPlanDate,
      status: "applied",
    })
    .select("id, submitted_at")
    .maybeSingle();

  if (error || !data) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      error?.message ?? "지원 내역을 저장하지 못했습니다."
    );
  }

  const parsedResponse = CampaignApplicationResponseSchema.safeParse({
    applicationId: data.id,
    status: "applied" as const,
    submittedAt: data.submitted_at,
  });

  if (!parsedResponse.success) {
    return failure(
      500,
      campaignErrorCodes.detailFetchFailed,
      "지원 응답이 올바르지 않습니다.",
      parsedResponse.error.format()
    );
  }

  return success(parsedResponse.data, 201);
};

export const getMyApplications = async (
  client: SupabaseClient,
  userId: string,
  query: MyApplicationsQuery
): Promise<
  HandlerResult<MyApplicationsResponse, CampaignErrorCode, unknown>
> => {
  const { data, error } = await client
    .from(CAMPAIGN_APPLICATIONS_TABLE)
    .select(
      "id, status, submitted_at, visit_plan_date, campaign:campaigns(id, title, thumbnail_url, recruitment_end_at, benefits, mission)"
    )
    .eq("influencer_user_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    return failure(500, campaignErrorCodes.fetchFailed, error.message);
  }

  const filtered = (data ?? []).filter((item) =>
    query.status ? item.status === query.status : true
  );

  const mapped = filtered
    .filter(
      (item) =>
        item.campaign &&
        Array.isArray(item.campaign) &&
        item.campaign.length > 0
    )
    .map((item) => {
      const campaign = Array.isArray(item.campaign)
        ? item.campaign[0]
        : item.campaign;
      return {
        applicationId: item.id,
        status: item.status ?? "applied",
        submittedAt: item.submitted_at,
        visitPlanDate: item.visit_plan_date,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          thumbnailUrl: campaign.thumbnail_url ?? undefined,
          recruitmentEndAt: campaign.recruitment_end_at,
          benefits: campaign.benefits,
          mission: campaign.mission,
        },
      };
    });

  const parsed = MyApplicationsResponseSchema.safeParse({
    items: mapped,
  });

  if (!parsed.success) {
    return failure(
      500,
      campaignErrorCodes.fetchFailed,
      "지원 내역 응답이 올바르지 않습니다.",
      parsed.error.format()
    );
  }

  return success(parsed.data);
};
