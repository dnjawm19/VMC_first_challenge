"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type {
  CampaignListQuery,
  CampaignListResponse,
} from "@/features/campaigns/lib/dto";

const ENDPOINT = "/api/campaigns";

export type CampaignListParams = Partial<CampaignListQuery>;

const serializeParams = (params: CampaignListParams) => {
  const searchParams = new URLSearchParams();

  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  if (params.pageSize) {
    searchParams.set("pageSize", String(params.pageSize));
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const queryString = searchParams.toString();
  return queryString ? `${ENDPOINT}?${queryString}` : ENDPOINT;
};

export const useCampaignListQuery = (params: CampaignListParams = {}) =>
  useQuery<CampaignListResponse, Error>({
    queryKey: ["campaigns", params],
    queryFn: async () => {
      try {
        const url = serializeParams(params);
        const { data } = await apiClient.get<CampaignListResponse>(url);
        return data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "캠페인 목록을 불러오지 못했습니다."),
        );
      }
    },
    staleTime: 30_000,
  });
