export const CAMPAIGN_DEFAULT_PAGE_SIZE = 12;
export const CAMPAIGN_MAX_PAGE_SIZE = 50;

export const CAMPAIGN_SORT_OPTIONS = [
  'latest',
  'endingSoon',
] as const;

export type CampaignSortOption = (typeof CAMPAIGN_SORT_OPTIONS)[number];

export const CAMPAIGN_SORT_LABELS: Record<CampaignSortOption, string> = {
  latest: '최신순',
  endingSoon: '마감 임박순',
};

export const CAMPAIGN_STATUS_FILTERS = ['recruiting', 'closed', 'selected'] as const;
export type CampaignStatusFilter = (typeof CAMPAIGN_STATUS_FILTERS)[number];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatusFilter, string> = {
  recruiting: '모집중',
  closed: '모집종료',
  selected: '선정완료',
};
