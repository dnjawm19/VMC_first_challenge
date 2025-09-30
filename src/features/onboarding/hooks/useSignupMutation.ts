"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type {
  SignupRequest,
  SignupResponse,
} from "@/features/onboarding/lib/dto";

const SIGNUP_ENDPOINT = "/api/onboarding/signup";

type SignupMutationError = {
  message: string;
};

export const useSignupMutation = () =>
  useMutation<SignupResponse, SignupMutationError, SignupRequest>({
    mutationFn: async (payload) => {
      try {
        const { data } = await apiClient.post<SignupResponse>(
          SIGNUP_ENDPOINT,
          payload
        );

        return data;
      } catch (error) {
        throw {
          message: extractApiErrorMessage(error, "회원가입 요청에 실패했습니다."),
        } satisfies SignupMutationError;
      }
    },
  });
