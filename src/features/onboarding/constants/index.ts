export const ONBOARDING_ROLES = ['advertiser', 'influencer'] as const;

export type OnboardingRole = (typeof ONBOARDING_ROLES)[number];

export const ONBOARDING_ROLE_LABELS: Record<OnboardingRole, string> = {
  advertiser: '광고주',
  influencer: '인플루언서',
} as const;

export const ONBOARDING_AUTH_METHODS = ['email', 'external'] as const;

export type OnboardingAuthMethod = (typeof ONBOARDING_AUTH_METHODS)[number];

export const DEFAULT_ONBOARDING_AUTH_METHOD: OnboardingAuthMethod =
  ONBOARDING_AUTH_METHODS[0];

export type TermsDefinition = {
  code: string;
  version: string;
  title: string;
  required: boolean;
};

export const ONBOARDING_TERMS: TermsDefinition[] = [
  {
    code: 'SERVICE_TERMS',
    version: '1.0.0',
    title: '서비스 이용약관 (필수)',
    required: true,
  },
  {
    code: 'PRIVACY_POLICY',
    version: '1.0.0',
    title: '개인정보 처리방침 (필수)',
    required: true,
  },
];
