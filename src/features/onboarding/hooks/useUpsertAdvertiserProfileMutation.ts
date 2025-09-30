"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  extractApiErrorMessage,
  isAxiosError,
} from "@/lib/remote/api-client";
import {
  AdvertiserProfileUpsertRequestSchema,
  type AdvertiserProfileResponse,
  type AdvertiserProfileUpsertRequest,
} from "@/features/onboarding/backend/schema";
import { getAuthHeader } from "@/features/auth/lib/get-auth-header";
import { onboardingErrorCodes } from "@/features/onboarding/backend/error";

const ENDPOINT = "/api/onboarding/advertiser";

type MutationError = {
  message: string;
  code?: string;
};

export const useUpsertAdvertiserProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AdvertiserProfileResponse,
    MutationError,
    AdvertiserProfileUpsertRequest
  >({
    mutationFn: async (payload) => {
      const parsed = AdvertiserProfileUpsertRequestSchema.safeParse(payload);

      if (!parsed.success) {
        throw {
          message: "입력값을 다시 확인해 주세요.",
          code: onboardingErrorCodes.validationError,
        } satisfies MutationError;
      }

      try {
        const headers = await getAuthHeader();
        const { data } = await apiClient.put<AdvertiserProfileResponse>(
          ENDPOINT,
          parsed.data,
          { headers }
        );

        await queryClient.invalidateQueries({
          queryKey: ["onboarding", "advertiser", "profile"],
        });

        return data;
      } catch (error) {
        if (isAxiosError(error)) {
          const message = extractApiErrorMessage(
            error,
            "광고주 정보를 저장하지 못했습니다."
          );
          const code = error.response?.data?.error?.code;

          throw {
            message,
            code: typeof code === "string" ? code : undefined,
          } satisfies MutationError;
        }

        throw {
          message: "광고주 정보를 저장하지 못했습니다.",
        } satisfies MutationError;
      }
    },
  });
};
