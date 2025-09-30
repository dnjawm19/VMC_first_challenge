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
        : 'recruiting',
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
