export const onboardingErrorCodes = {
  validationError: 'ONBOARDING_VALIDATION_ERROR',
  authCreationFailed: 'ONBOARDING_AUTH_CREATION_FAILED',
  profileInsertFailed: 'ONBOARDING_PROFILE_INSERT_FAILED',
  termsInsertFailed: 'ONBOARDING_TERMS_INSERT_FAILED',
  duplicateEmail: 'ONBOARDING_DUPLICATE_EMAIL',
} as const;

export type OnboardingErrorCode =
  (typeof onboardingErrorCodes)[keyof typeof onboardingErrorCodes];
