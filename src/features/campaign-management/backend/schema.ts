import { z } from "zod";
import {
  ADVERTISER_CAMPAIGN_SORT_OPTIONS,
  CAMPAIGN_STATUS_OPTIONS,
  MIN_CAMPAIGN_CAPACITY,
  MAX_CAMPAIGN_CAPACITY,
} from "@/features/campaign-management/constants";

export const AdvertiserCampaignQuerySchema = z.object({
  sort: z
    .string()
    .optional()
    .transform((value) =>
      value &&
      ADVERTISER_CAMPAIGN_SORT_OPTIONS.includes(
        value as (typeof ADVERTISER_CAMPAIGN_SORT_OPTIONS)[number]
      )
        ? (value as (typeof ADVERTISER_CAMPAIGN_SORT_OPTIONS)[number])
        : "latest"
    ),
  status: z
    .string()
    .optional()
    .transform((value) =>
      value &&
      CAMPAIGN_STATUS_OPTIONS.includes(
        value as (typeof CAMPAIGN_STATUS_OPTIONS)[number]
      )
        ? (value as (typeof CAMPAIGN_STATUS_OPTIONS)[number])
        : undefined
    ),
});

export type AdvertiserCampaignQuery = z.infer<
  typeof AdvertiserCampaignQuerySchema
>;

export const AdvertiserCampaignItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  recruitmentStartAt: z.string(),
  recruitmentEndAt: z.string(),
  capacity: z.number().int().nonnegative(),
  benefits: z.string(),
  mission: z.string(),
  storeInfo: z.string(),
  status: z.enum(CAMPAIGN_STATUS_OPTIONS),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AdvertiserCampaignListResponseSchema = z.object({
  items: z.array(AdvertiserCampaignItemSchema),
  meta: z.object({
    verified: z.boolean(),
  }),
});

export type AdvertiserCampaignListResponse = z.infer<
  typeof AdvertiserCampaignListResponseSchema
>;

const dateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  .transform((value) => new Date(value))
  .refine((date) => !Number.isNaN(date.getTime()), "유효한 날짜가 아닙니다.");

export const CampaignCreateRequestSchema = z
  .object({
    title: z.string().min(1, "체험단명을 입력해 주세요."),
    recruitmentStartAt: dateSchema,
    recruitmentEndAt: dateSchema,
    capacity: z
      .number({ invalid_type_error: "모집 인원은 숫자여야 합니다." })
      .int("모집 인원은 정수여야 합니다.")
      .min(MIN_CAMPAIGN_CAPACITY, "모집 인원은 1명 이상이어야 합니다.")
      .max(MAX_CAMPAIGN_CAPACITY, "모집 인원이 너무 큽니다."),
    benefits: z.string().min(1, "제공 혜택을 입력해 주세요."),
    mission: z.string().min(1, "미션을 입력해 주세요."),
    storeInfo: z.string().min(1, "매장 정보를 입력해 주세요."),
    thumbnailUrl: z.string().url("올바른 URL을 입력해 주세요.").optional(),
  })
  .refine((data) => data.recruitmentEndAt >= data.recruitmentStartAt, {
    message: "모집 종료일은 시작일 이후여야 합니다.",
    path: ["recruitmentEndAt"],
  })
  .transform((data) => ({
    title: data.title,
    recruitmentStartAt: data.recruitmentStartAt.toISOString().slice(0, 10),
    recruitmentEndAt: data.recruitmentEndAt.toISOString().slice(0, 10),
    capacity: data.capacity,
    benefits: data.benefits,
    mission: data.mission,
    storeInfo: data.storeInfo,
    thumbnailUrl: data.thumbnailUrl,
  }));

export type CampaignCreateRequest = z.infer<typeof CampaignCreateRequestSchema>;

export const CampaignCreateResponseSchema = z.object({
  campaignId: z.string().uuid(),
});

export type CampaignCreateResponse = z.infer<
  typeof CampaignCreateResponseSchema
>;

export const CampaignManagementApplicantSchema = z.object({
  applicationId: z.string().uuid(),
  influencerId: z.string().uuid(),
  influencerName: z.string().nullable(),
  status: z.enum(["applied", "selected", "rejected"]),
  motivation: z.string().nullable(),
  visitPlanDate: z.string(),
  submittedAt: z.string(),
});

export type CampaignManagementApplicant = z.infer<
  typeof CampaignManagementApplicantSchema
>;

export const CampaignManagementDetailSchema = z.object({
  campaign: z.object({
    id: z.string().uuid(),
    title: z.string(),
    recruitmentStartAt: z.string(),
    recruitmentEndAt: z.string(),
    capacity: z.number().int().nonnegative(),
    benefits: z.string(),
    mission: z.string(),
    storeInfo: z.string(),
    status: z.enum(CAMPAIGN_STATUS_OPTIONS),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  applicants: z.array(CampaignManagementApplicantSchema),
  actions: z.object({
    canCloseRecruitment: z.boolean(),
    canSelectApplicants: z.boolean(),
    capacity: z.number().int().nonnegative(),
  }),
});

export type CampaignManagementDetail = z.infer<
  typeof CampaignManagementDetailSchema
>;

export const CampaignManagementDetailResponseSchema = z.object({
  detail: CampaignManagementDetailSchema,
});

export type CampaignManagementDetailResponse = z.infer<
  typeof CampaignManagementDetailResponseSchema
>;

export const CampaignActionRequestSchema = z.union([
  z.object({
    action: z.literal("closeRecruitment"),
  }),
  z.object({
    action: z.literal("selectApplicants"),
    applicantIds: z
      .array(z.string().uuid())
      .min(1, "선정할 인원을 선택해 주세요."),
  }),
]);

export type CampaignActionRequest = z.infer<typeof CampaignActionRequestSchema>;

export const CampaignActionResponseSchema =
  CampaignManagementDetailResponseSchema;

export type CampaignActionResponse = z.infer<
  typeof CampaignActionResponseSchema
>;
