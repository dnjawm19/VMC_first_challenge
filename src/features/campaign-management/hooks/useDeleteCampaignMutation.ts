"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  extractApiErrorMessage,
  isAxiosError,
} from "@/lib/remote/api-client";
import type { CampaignDeleteResponse } from "@/features/campaign-management/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";

export const useDeleteCampaignMutation = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CampaignDeleteResponse, Error, void>({
    mutationFn: async () => {
      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.delete<CampaignDeleteResponse>(
          `/api/advertiser/campaigns/${campaignId}`,
          { headers }
        );

        await queryClient.invalidateQueries({ queryKey: ["advertiserCampaigns"] });
        await queryClient.invalidateQueries({ queryKey: ["advertiserCampaign", campaignId] });

        return data;
      } catch (error) {
        if (isAxiosError(error)) {
          throw new Error(
            extractApiErrorMessage(error, "체험단을 삭제하지 못했습니다."),
          );
        }

        throw new Error("체험단을 삭제하지 못했습니다.");
      }
    },
  });
};
