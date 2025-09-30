import { z } from 'zod';
import {
  INFLUENCER_CHANNEL_TYPES,
  ONBOARDING_AUTH_METHODS,
  ONBOARDING_ROLES,
} from '@/features/onboarding/constants';

export const SignupTermsSchema = z.object({
  code: z.string().min(1, 'terms code is required'),
  version: z.string().min(1, 'terms version is required'),
});

const isoDateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  .refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }, '유효한 날짜가 아닙니다.');

export const SignupRequestSchema = z.object({
  fullName: z.string().min(1, '이름을 입력해 주세요.'),
  phone: z
    .string()
    .min(10, '휴대폰 번호를 정확히 입력해 주세요.')
    .max(20, '휴대폰 번호가 너무 깁니다.'),
  birthDate: isoDateSchema,
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  role: z.enum(ONBOARDING_ROLES, {
    errorMap: () => ({ message: '역할을 선택해 주세요.' }),
  }),
  authMethod: z.enum(ONBOARDING_AUTH_METHODS),
  terms: z
    .array(SignupTermsSchema)
    .min(1, '필수 약관에 동의해 주세요.')
    .superRefine((terms, ctx) => {
      const codes = new Set(terms.map((term) => term.code));

      if (codes.size !== terms.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '약관이 중복되어 있습니다.',
        });
      }
    }),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  requiresEmailVerification: z.boolean(),
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;

export const InfluencerChannelInputSchema = z.object({
  type: z.enum(INFLUENCER_CHANNEL_TYPES, {
    errorMap: () => ({ message: '채널 유형을 선택해 주세요.' }),
  }),
  name: z.string().min(1, '채널명을 입력해 주세요.'),
  url: z.string().min(1, '채널 URL을 입력해 주세요.'),
  followerCount: z
    .number({ invalid_type_error: '팔로워 수는 숫자여야 합니다.' })
    .int('팔로워 수는 정수여야 합니다.')
    .min(0, '팔로워 수는 0 이상이어야 합니다.'),
});

export const InfluencerProfileUpsertRequestSchema = z.object({
  birthDate: isoDateSchema,
  channels: z
    .array(InfluencerChannelInputSchema)
    .min(1, '최소 한 개 이상의 채널을 등록해 주세요.'),
});

export type InfluencerProfileUpsertRequest = z.infer<
  typeof InfluencerProfileUpsertRequestSchema
>;

export const InfluencerChannelSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(INFLUENCER_CHANNEL_TYPES),
  name: z.string(),
  url: z.string().url(),
  status: z.enum(['pending', 'verified', 'failed']),
  followerCount: z.number().int().nonnegative(),
});

export const InfluencerProfileSchema = z.object({
  birthDate: isoDateSchema,
  agePolicyStatus: z.enum(['pending', 'verified', 'rejected']),
});

export const InfluencerProfileResponseSchema = z.object({
  profile: InfluencerProfileSchema.nullable(),
  channels: z.array(InfluencerChannelSchema),
});

export type InfluencerProfileResponse = z.infer<
  typeof InfluencerProfileResponseSchema
>;

export const AdvertiserProfileUpsertRequestSchema = z.object({
  companyName: z.string().min(1, '업체명을 입력해 주세요.'),
  address: z.string().min(1, '주소를 입력해 주세요.'),
  storePhone: z
    .string()
    .min(9, '업장 전화번호를 정확히 입력해 주세요.')
    .max(20, '업장 전화번호가 너무 깁니다.'),
  businessRegistrationNumber: z
    .string()
    .min(10, '사업자등록번호를 정확히 입력해 주세요.')
    .max(20, '사업자등록번호가 너무 깁니다.'),
  representativeName: z.string().min(1, '대표자명을 입력해 주세요.'),
});

export type AdvertiserProfileUpsertRequest = z.infer<
  typeof AdvertiserProfileUpsertRequestSchema
>;

export const AdvertiserProfileResponseSchema = z.object({
  profile: z
    .object({
      companyName: z.string(),
      address: z.string(),
      storePhone: z.string(),
      representativeName: z.string(),
      businessRegistrationNumber: z.string(),
      verificationStatus: z.enum(['pending', 'verified', 'rejected']),
    })
    .nullable(),
});

export type AdvertiserProfileResponse = z.infer<
  typeof AdvertiserProfileResponseSchema
>;
