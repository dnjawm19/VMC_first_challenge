export const ADVERTISER_CAMPAIGN_SORT_OPTIONS = ['latest', 'endingSoon'] as const;
export type AdvertiserCampaignSortOption =
  (typeof ADVERTISER_CAMPAIGN_SORT_OPTIONS)[number];

export const ADVERTISER_CAMPAIGN_SORT_LABELS: Record<
  AdvertiserCampaignSortOption,
  string
> = {
  latest: '최신 생성순',
  endingSoon: '마감 임박순',
};

export const CAMPAIGN_STATUS_OPTIONS = ['recruiting', 'closed', 'selected'] as const;
export type CampaignStatusOption = (typeof CAMPAIGN_STATUS_OPTIONS)[number];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatusOption, string> = {
  recruiting: '모집중',
  closed: '모집종료',
  selected: '선정완료',
};

export const MIN_CAMPAIGN_CAPACITY = 1;
export const MAX_CAMPAIGN_CAPACITY = 1000;
