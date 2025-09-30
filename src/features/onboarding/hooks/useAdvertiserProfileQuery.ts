"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { AdvertiserProfileResponse } from "@/features/onboarding/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";

const ENDPOINT = "/api/onboarding/advertiser";

export const useAdvertiserProfileQuery = () =>
  useQuery<AdvertiserProfileResponse, Error>({
    queryKey: ["onboarding", "advertiser", "profile"],
    queryFn: async () => {
      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.get<AdvertiserProfileResponse>(ENDPOINT, {
          headers,
        });

        return data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "광고주 정보를 불러오지 못했습니다.")
        );
      }
    },
    staleTime: 60 * 1000,
  });
