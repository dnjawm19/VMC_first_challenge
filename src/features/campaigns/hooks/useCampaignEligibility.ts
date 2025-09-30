"use client";

import { useMemo } from "react";
import type { CampaignEligibility } from "@/features/campaigns/backend/schema";

export type CampaignEligibilityResult = {
  canApply: boolean;
  message: string;
  status: CampaignEligibility["status"];
};

export const useCampaignEligibility = (
  eligibility: CampaignEligibility | undefined
): CampaignEligibilityResult =>
  useMemo(() => {
    if (!eligibility) {
      return {
        canApply: false,
        message: "지원 가능 여부를 확인할 수 없습니다.",
        status: "campaign_closed",
      } satisfies CampaignEligibilityResult;
    }

    return {
      canApply: eligibility.status === "can_apply",
      message: eligibility.reason,
      status: eligibility.status,
    } satisfies CampaignEligibilityResult;
  }, [eligibility]);
