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
  CampaignListResponseSchema,
  type CampaignListQuery,
  type CampaignListResponse,
} from '@/features/campaigns/backend/schema';

const CAMPAIGNS_TABLE = 'campaigns';

const mapSortToOrder = (
  sort: CampaignListQuery['sort'],
): { column: string; ascending: boolean } => {
  switch (sort) {
    case 'endingSoon':
      return { column: 'recruitment_end_at', ascending: true };
    case 'latest':
    default:
      return { column: 'created_at', ascending: false };
  }
};

export const getCampaigns = async (
  client: SupabaseClient,
  query: CampaignListQuery,
): Promise<HandlerResult<CampaignListResponse, CampaignErrorCode, unknown>> => {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 12;
  const offsetStart = (page - 1) * pageSize;
  const offsetEnd = offsetStart + pageSize - 1;
  const { column, ascending } = mapSortToOrder(query.sort ?? 'latest');

  const { data, error, count } = await client
    .from(CAMPAIGNS_TABLE)
    .select(
      'id, title, recruitment_start_at, recruitment_end_at, capacity, benefits, mission, store_info, status, thumbnail_url',
      { count: 'exact' },
    )
    .eq('status', query.status ?? 'recruiting')
    .order(column, { ascending, nullsFirst: false })
    .range(offsetStart, offsetEnd);

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
    status: row.status ?? 'recruiting',
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
      '캠페인 응답 형식이 올바르지 않습니다.',
      response.error.format(),
    );
  }

  return success(response.data);
};
