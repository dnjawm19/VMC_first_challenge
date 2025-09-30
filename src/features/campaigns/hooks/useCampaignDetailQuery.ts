"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { CampaignDetailResponse } from "@/features/campaigns/backend/schema";
import { getOptionalAuthHeader } from "@/features/auth/lib/get-auth-header";

export const useCampaignDetailQuery = (campaignId: string | undefined) =>
  useQuery<CampaignDetailResponse, Error>({
    queryKey: ["campaign", campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      if (!campaignId) {
        throw new Error("캠페인 ID가 필요합니다.");
      }

      try {
        const headers = await getOptionalAuthHeader();
        const { data } = await apiClient.get<CampaignDetailResponse>(
          `/api/campaigns/${campaignId}`,
          headers ? { headers } : undefined
        );

        return data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "체험단 상세 정보를 불러오지 못했습니다.")
        );
      }
    },
    staleTime: 30_000,
  });
