export const campaignErrorCodes = {
  validationError: 'CAMPAIGN_VALIDATION_ERROR',
  fetchFailed: 'CAMPAIGN_FETCH_FAILED',
} as const;

export type CampaignErrorCode =
  (typeof campaignErrorCodes)[keyof typeof campaignErrorCodes];
