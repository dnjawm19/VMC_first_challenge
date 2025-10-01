import { z } from 'zod';
import {
  CAMPAIGN_DEFAULT_PAGE_SIZE,
  CAMPAIGN_MAX_PAGE_SIZE,
  CAMPAIGN_SORT_OPTIONS,
  CAMPAIGN_STATUS_FILTERS,
} from '@/features/campaigns/constants';

export const CampaignListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return 1;
      }
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  pageSize: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return CAMPAIGN_DEFAULT_PAGE_SIZE;
      }
      const parsed = Number.parseInt(value, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        return CAMPAIGN_DEFAULT_PAGE_SIZE;
      }
      if (parsed > CAMPAIGN_MAX_PAGE_SIZE) {
        return CAMPAIGN_MAX_PAGE_SIZE;
      }
      return parsed;
    }),
  sort: z
    .string()
    .optional()
    .refine(
      (value) => !value || CAMPAIGN_SORT_OPTIONS.includes(value as (typeof CAMPAIGN_SORT_OPTIONS)[number]),
      '정렬 옵션이 올바르지 않습니다.',
    )
    .transform((value) => (value ? (value as (typeof CAMPAIGN_SORT_OPTIONS)[number]) : 'latest')),
  status: z
    .string()
    .optional()
    .transform((value) =>
      value && CAMPAIGN_STATUS_FILTERS.includes(value as (typeof CAMPAIGN_STATUS_FILTERS)[number])
        ? (value as (typeof CAMPAIGN_STATUS_FILTERS)[number])
        : 'all',
    ),
});

export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>;

export const CampaignSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  recruitmentStartAt: z.string(),
  recruitmentEndAt: z.string(),
  capacity: z.number().int().nonnegative(),
  benefits: z.string(),
  mission: z.string(),
  storeInfo: z.string(),
  status: z.enum(['recruiting', 'closed', 'selected']),
  thumbnailUrl: z.string().url().optional(),
});

export type CampaignSummary = z.infer<typeof CampaignSummarySchema>;

export const CampaignListResponseSchema = z.object({
  campaigns: z.array(CampaignSummarySchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hasNextPage: z.boolean(),
  }),
});

export type CampaignListResponse = z.infer<typeof CampaignListResponseSchema>;

export const CampaignIdParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const CampaignEligibilitySchema = z.object({
  status: z.enum([
    'can_apply',
    'needs_login',
    'not_influencer',
    'profile_incomplete',
    'already_applied',
    'campaign_closed',
  ]),
  reason: z.string(),
});

export type CampaignEligibility = z.infer<typeof CampaignEligibilitySchema>;

export const CampaignDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional().nullable(),
  recruitmentStartAt: z.string(),
  recruitmentEndAt: z.string(),
  capacity: z.number().int().nonnegative(),
  benefits: z.string(),
  mission: z.string(),
  storeInfo: z.string(),
  status: z.enum(['recruiting', 'closed', 'selected']),
  thumbnailUrl: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CampaignDetail = z.infer<typeof CampaignDetailSchema>;

export const CampaignDetailResponseSchema = z.object({
  campaign: CampaignDetailSchema,
  eligibility: CampaignEligibilitySchema,
});

export type CampaignDetailResponse = z.infer<typeof CampaignDetailResponseSchema>;

const visitDateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  .refine((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= today;
  }, '방문 예정일은 오늘 이후여야 합니다.');

export const CampaignApplicationRequestSchema = z.object({
  motivation: z
    .string()
    .min(10, '각오 한마디를 최소 10자 이상 입력해 주세요.')
    .max(1000, '각오 한마디는 최대 1000자까지 입력할 수 있습니다.'),
  visitPlanDate: visitDateSchema,
});

export type CampaignApplicationRequest = z.infer<
  typeof CampaignApplicationRequestSchema
>;

export const CampaignApplicationResponseSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(['applied']),
  submittedAt: z.string(),
});

export type CampaignApplicationResponse = z.infer<
  typeof CampaignApplicationResponseSchema
>;

export const MyApplicationsQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((value) =>
      value && ['applied', 'selected', 'rejected'].includes(value)
        ? (value as 'applied' | 'selected' | 'rejected')
        : undefined,
    ),
});

export type MyApplicationsQuery = z.infer<typeof MyApplicationsQuerySchema>;

export const MyApplicationItemSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(['applied', 'selected', 'rejected']),
  submittedAt: z.string(),
  visitPlanDate: z.string(),
  campaign: z.object({
    id: z.string().uuid(),
    title: z.string(),
    thumbnailUrl: z.string().url().optional(),
    recruitmentEndAt: z.string(),
    benefits: z.string(),
    mission: z.string(),
  }),
});

export const MyApplicationsResponseSchema = z.object({
  items: z.array(MyApplicationItemSchema),
});

export type MyApplicationsResponse = z.infer<
  typeof MyApplicationsResponseSchema
>;
