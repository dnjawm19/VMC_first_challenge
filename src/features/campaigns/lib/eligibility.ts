import type { CampaignEligibility } from "@/features/campaigns/backend/schema";

export type CampaignEligibilityInput = {
  status: "recruiting" | "closed" | "selected";
  recruitmentEndAt: string;
  isLoggedIn: boolean;
  userRole?: string | null;
  influencerProfileComplete?: boolean;
  alreadyApplied?: boolean;
};

const isCampaignClosed = (status: CampaignEligibilityInput["status"], recruitmentEndAt: string) => {
  if (status !== "recruiting") {
    return true;
  }

  const endDate = new Date(recruitmentEndAt);
  const now = new Date();

  return Number.isNaN(endDate.getTime()) ? false : endDate < now;
};

export const evaluateCampaignEligibility = (
  input: CampaignEligibilityInput
): CampaignEligibility => {
  if (isCampaignClosed(input.status, input.recruitmentEndAt)) {
    return {
      status: "campaign_closed",
      reason: "모집이 종료된 체험단입니다.",
    } satisfies CampaignEligibility;
  }

  if (!input.isLoggedIn) {
    return {
      status: "needs_login",
      reason: "지원하기 위해서는 로그인이 필요합니다.",
    } satisfies CampaignEligibility;
  }

  if (input.userRole !== "influencer") {
    return {
      status: "not_influencer",
      reason: "인플루언서 계정만 지원할 수 있습니다.",
    } satisfies CampaignEligibility;
  }

  if (!input.influencerProfileComplete) {
    return {
      status: "profile_incomplete",
      reason: "인플루언서 프로필과 채널 정보를 먼저 등록해 주세요.",
    } satisfies CampaignEligibility;
  }

  if (input.alreadyApplied) {
    return {
      status: "already_applied",
      reason: "이미 지원한 체험단입니다.",
    } satisfies CampaignEligibility;
  }

  return {
    status: "can_apply",
    reason: "지원이 가능합니다.",
  } satisfies CampaignEligibility;
};
