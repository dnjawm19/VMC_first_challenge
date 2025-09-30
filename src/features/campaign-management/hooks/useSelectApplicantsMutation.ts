"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage, isAxiosError } from "@/lib/remote/api-client";
import type { CampaignActionResponse } from "@/features/campaign-management/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";

export const useSelectApplicantsMutation = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CampaignActionResponse, Error, string[]>({
    mutationFn: async (applicantIds) => {
      if (applicantIds.length === 0) {
        throw new Error("선정할 지원자를 선택해 주세요.");
      }

      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.post<CampaignActionResponse>(
          `/api/advertiser/campaigns/${campaignId}/actions`,
          { action: "selectApplicants", applicantIds },
          { headers }
        );

        await queryClient.invalidateQueries({ queryKey: ["advertiserCampaign", campaignId] });
        await queryClient.invalidateQueries({ queryKey: ["advertiserCampaigns"] });

        return data;
      } catch (error) {
        if (isAxiosError(error)) {
          throw new Error(
            extractApiErrorMessage(error, "선정 처리에 실패했습니다."),
          );
        }

        throw new Error("선정 처리에 실패했습니다.");
      }
    },
  });
};
