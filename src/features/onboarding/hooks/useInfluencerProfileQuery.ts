"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { InfluencerProfileResponse } from "@/features/onboarding/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";

const ENDPOINT = "/api/onboarding/influencer";

export const useInfluencerProfileQuery = () =>
  useQuery<InfluencerProfileResponse, Error>({
    queryKey: ["onboarding", "influencer", "profile"],
    queryFn: async () => {
      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.get<InfluencerProfileResponse>(ENDPOINT, {
          headers,
        });

        return data;
      } catch (error) {
        throw new Error(
          extractApiErrorMessage(error, "인플루언서 정보를 불러오지 못했습니다.")
        );
      }
    },
    staleTime: 60 * 1000,
  });
