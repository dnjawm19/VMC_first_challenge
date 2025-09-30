"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  extractApiErrorMessage,
  isAxiosError,
} from "@/lib/remote/api-client";
import {
  CampaignApplicationRequestSchema,
  type CampaignApplicationResponse,
  type CampaignApplicationRequest,
} from "@/features/campaigns/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";

type MutationError = {
  message: string;
  code?: string;
};

export const useCampaignApplicationMutation = (campaignId: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    CampaignApplicationResponse,
    MutationError,
    CampaignApplicationRequest
  >({
    mutationFn: async (payload) => {
      const parsed = CampaignApplicationRequestSchema.safeParse(payload);

      if (!parsed.success) {
        throw {
          message: "입력값을 다시 확인해 주세요.",
        } satisfies MutationError;
      }

      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.post<CampaignApplicationResponse>(
          `/api/campaigns/${campaignId}/applications`,
          parsed.data,
          { headers }
        );

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] }),
          queryClient.invalidateQueries({ queryKey: ["onboarding", "influencer"] }),
          queryClient.invalidateQueries({ queryKey: ["applications", { campaignId }] }),
        ]);

        return data;
      } catch (error) {
        if (isAxiosError(error)) {
          const message = extractApiErrorMessage(
            error,
            "체험단 지원에 실패했습니다."
          );
          const code = error.response?.data?.error?.code;

          throw {
            message,
            code: typeof code === "string" ? code : undefined,
          } satisfies MutationError;
        }

        throw {
          message: "체험단 지원에 실패했습니다.",
        } satisfies MutationError;
      }
    },
  });
};
