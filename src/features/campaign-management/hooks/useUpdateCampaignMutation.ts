"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  extractApiErrorMessage,
  isAxiosError,
} from "@/lib/remote/api-client";
import {
  CampaignFormSchema,
  type CampaignFormValues,
} from "@/features/campaign-management/components/campaign-form";
import type { CampaignManagementDetailResponse } from "@/features/campaign-management/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";

export const useUpdateCampaignMutation = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CampaignManagementDetailResponse, Error, CampaignFormValues>({
    mutationFn: async (payload) => {
      const parsed = CampaignFormSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error("입력값을 다시 확인해 주세요.");
      }

      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.patch<CampaignManagementDetailResponse>(
          `/api/advertiser/campaigns/${campaignId}`,
          parsed.data,
          { headers }
        );

        await queryClient.invalidateQueries({ queryKey: ["advertiserCampaign", campaignId] });
        await queryClient.invalidateQueries({ queryKey: ["advertiserCampaigns"] });

        return data;
      } catch (error) {
        if (isAxiosError(error)) {
          throw new Error(
            extractApiErrorMessage(error, "체험단 정보를 수정하지 못했습니다."),
          );
        }

        throw new Error("체험단 정보를 수정하지 못했습니다.");
      }
    },
  });
};
