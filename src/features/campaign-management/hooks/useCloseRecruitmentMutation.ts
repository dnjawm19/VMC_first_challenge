"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage, isAxiosError } from "@/lib/remote/api-client";
import type { CampaignActionResponse } from "@/features/campaign-management/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";

export const useCloseRecruitmentMutation = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CampaignActionResponse, Error, void>({
    mutationFn: async () => {
      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.post<CampaignActionResponse>(
          `/api/advertiser/campaigns/${campaignId}/actions`,
          { action: "closeRecruitment" },
          { headers }
        );

        await queryClient.invalidateQueries({ queryKey: ["advertiserCampaign", campaignId] });
        await queryClient.invalidateQueries({ queryKey: ["advertiserCampaigns"] });

        return data;
      } catch (error) {
        if (isAxiosError(error)) {
          throw new Error(
            extractApiErrorMessage(error, "모집 종료에 실패했습니다."),
          );
        }

        throw new Error("모집 종료에 실패했습니다.");
      }
    },
  });
};
