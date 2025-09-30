"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { MyApplicationsResponse } from "@/features/campaigns/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";

export type MyApplicationsParams = {
  status?: "applied" | "selected" | "rejected";
};

const serializeParams = (params: MyApplicationsParams) => {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const queryString = searchParams.toString();
  return queryString ? `/api/me/applications?${queryString}` : "/api/me/applications";
};

export const useMyApplicationsQuery = (params: MyApplicationsParams = {}) =>
  useQuery<MyApplicationsResponse, Error>({
    queryKey: ["myApplications", params],
    queryFn: async () => {
      try {
        const headers = await getAuthHeader();
        const url = serializeParams(params);
        const { data } = await apiClient.get<MyApplicationsResponse>(url, {
          headers,
        });

        return data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "내 지원 목록을 불러오지 못했습니다."),
        );
      }
    },
  });
