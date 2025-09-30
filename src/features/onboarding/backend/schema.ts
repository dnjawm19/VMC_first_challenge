import { z } from 'zod';
import {
  ONBOARDING_AUTH_METHODS,
  ONBOARDING_ROLES,
} from '@/features/onboarding/constants';

export const SignupTermsSchema = z.object({
  code: z.string().min(1, 'terms code is required'),
  version: z.string().min(1, 'terms version is required'),
});

export const SignupRequestSchema = z.object({
  fullName: z.string().min(1, '이름을 입력해 주세요.'),
  phone: z
    .string()
    .min(10, '휴대폰 번호를 정확히 입력해 주세요.')
    .max(20, '휴대폰 번호가 너무 깁니다.'),
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
