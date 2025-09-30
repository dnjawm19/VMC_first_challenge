"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import {
  InfluencerProfileUpsertRequestSchema,
  type InfluencerProfileResponse,
  type InfluencerProfileUpsertRequest,
} from "@/features/onboarding/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";

const ENDPOINT = "/api/onboarding/influencer";

type MutationError = {
  message: string;
};

export const useUpsertInfluencerProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InfluencerProfileResponse,
    MutationError,
    InfluencerProfileUpsertRequest
  >({
    mutationFn: async (payload) => {
      const parsed = InfluencerProfileUpsertRequestSchema.safeParse(payload);

      if (!parsed.success) {
        throw {
          message: "입력값을 다시 확인해 주세요.",
        } satisfies MutationError;
      }

      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.put<InfluencerProfileResponse>(
          ENDPOINT,
          parsed.data,
          {
            headers,
          }
        );

        await queryClient.invalidateQueries({
          queryKey: ["onboarding", "influencer", "profile"],
        });

        return data;
      } catch (error) {
        throw {
          message: extractApiErrorMessage(
            error,
            "인플루언서 정보를 저장하지 못했습니다."
          ),
        } satisfies MutationError;
      }
    },
  });
};
