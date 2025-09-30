export const campaignErrorCodes = {
  validationError: 'CAMPAIGN_VALIDATION_ERROR',
  fetchFailed: 'CAMPAIGN_FETCH_FAILED',
  notFound: 'CAMPAIGN_NOT_FOUND',
  detailFetchFailed: 'CAMPAIGN_DETAIL_FETCH_FAILED',
} as const;

export type CampaignErrorCode =
  (typeof campaignErrorCodes)[keyof typeof campaignErrorCodes];
