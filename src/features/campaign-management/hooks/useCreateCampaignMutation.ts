"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  extractApiErrorMessage,
  isAxiosError,
} from "@/lib/remote/api-client";
import {
  CampaignCreateRequestSchema,
  type CampaignCreateRequest,
  type CampaignCreateResponse,
} from "@/features/campaign-management/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";
import { campaignErrorCodes } from "@/features/campaigns/backend/error";

type MutationError = {
  message: string;
  code?: string;
};

export const useCreateCampaignMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CampaignCreateResponse, MutationError, CampaignCreateRequest>({
    mutationFn: async (payload) => {
      const parsed = CampaignCreateRequestSchema.safeParse(payload);

      if (!parsed.success) {
        throw {
          message: "입력값을 다시 확인해 주세요.",
          code: campaignErrorCodes.validationError,
        } satisfies MutationError;
      }

      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.post<CampaignCreateResponse>(
          "/api/advertiser/campaigns",
          parsed.data,
          { headers }
        );

        await queryClient.invalidateQueries({ queryKey: ["advertiserCampaigns"] });

        return data;
      } catch (error) {
        if (isAxiosError(error)) {
          const message = extractApiErrorMessage(
            error,
            "체험단을 생성하지 못했습니다."
          );
          const code = error.response?.data?.error?.code;

          throw {
            message,
            code: typeof code === "string" ? code : undefined,
          } satisfies MutationError;
        }

        throw {
          message: "체험단을 생성하지 못했습니다.",
        } satisfies MutationError;
      }
    },
  });
};
