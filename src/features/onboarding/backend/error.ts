export const onboardingErrorCodes = {
  validationError: 'ONBOARDING_VALIDATION_ERROR',
  authCreationFailed: 'ONBOARDING_AUTH_CREATION_FAILED',
  profileInsertFailed: 'ONBOARDING_PROFILE_INSERT_FAILED',
  termsInsertFailed: 'ONBOARDING_TERMS_INSERT_FAILED',
  duplicateEmail: 'ONBOARDING_DUPLICATE_EMAIL',
  unauthorized: 'ONBOARDING_UNAUTHORIZED',
  influencerProfileFetchFailed: 'ONBOARDING_INFLUENCER_PROFILE_FETCH_FAILED',
  influencerChannelFetchFailed: 'ONBOARDING_INFLUENCER_CHANNEL_FETCH_FAILED',
  influencerProfileUpsertFailed: 'ONBOARDING_INFLUENCER_PROFILE_UPSERT_FAILED',
  influencerChannelSyncFailed: 'ONBOARDING_INFLUENCER_CHANNEL_SYNC_FAILED',
  influencerChannelInvalid: 'ONBOARDING_INFLUENCER_CHANNEL_INVALID',
  advertiserProfileFetchFailed: 'ONBOARDING_ADVERTISER_PROFILE_FETCH_FAILED',
  advertiserProfileUpsertFailed: 'ONBOARDING_ADVERTISER_PROFILE_UPSERT_FAILED',
  advertiserBusinessNumberInvalid: 'ONBOARDING_ADVERTISER_BUSINESS_NUMBER_INVALID',
  advertiserBusinessNumberDuplicate: 'ONBOARDING_ADVERTISER_BUSINESS_NUMBER_DUPLICATE',
} as const;

export type OnboardingErrorCode =
  (typeof onboardingErrorCodes)[keyof typeof onboardingErrorCodes];
