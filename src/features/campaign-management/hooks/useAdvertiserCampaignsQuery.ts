"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { AdvertiserCampaignListResponse } from "@/features/campaign-management/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";
import type { AdvertiserCampaignSortOption, CampaignStatusOption } from "@/features/campaign-management/constants";

export type AdvertiserCampaignParams = {
  sort?: AdvertiserCampaignSortOption;
  status?: CampaignStatusOption;
};

const buildUrl = (params: AdvertiserCampaignParams) => {
  const searchParams = new URLSearchParams();

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const queryString = searchParams.toString();
  return queryString ? `/api/advertiser/campaigns?${queryString}` : "/api/advertiser/campaigns";
};

export const useAdvertiserCampaignsQuery = (params: AdvertiserCampaignParams = {}) =>
  useQuery<AdvertiserCampaignListResponse, Error>({
    queryKey: ["advertiserCampaigns", params],
    queryFn: async () => {
      try {
        const headers = await getAuthHeader();
        const url = buildUrl(params);
        const { data } = await apiClient.get<AdvertiserCampaignListResponse>(url, {
          headers,
        });

        return data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "체험단 목록을 불러오지 못했습니다."),
        );
      }
    },
  });
