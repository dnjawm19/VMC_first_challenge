"use client";

import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  CampaignForm,
  createCampaignDefaultValues,
  useCampaignForm,
  type CampaignFormValues,
} from "@/features/campaign-management/components/campaign-form";
import { useCreateCampaignMutation } from "@/features/campaign-management/hooks/useCreateCampaignMutation";
import type { CampaignCreateResponse } from "@/features/campaign-management/backend/schema";
import { campaignErrorCodes } from "@/features/campaigns/backend/error";

export type CampaignCreateFormProps = {
  submitLabel?: string;
  onSuccess?: (response: CampaignCreateResponse) => void;
};

export const CampaignCreateForm = ({
  submitLabel = "체험단 등록",
  onSuccess,
}: CampaignCreateFormProps) => {
  const { toast } = useToast();
  const mutation = useCreateCampaignMutation();
  const defaultValues = useMemo(() => createCampaignDefaultValues(), []);
  const form = useCampaignForm(defaultValues);

  const isSubmitting = mutation.isPending || form.formState.isSubmitting;

  const handleSubmit = (values: CampaignFormValues) => {
    mutation.mutate(values, {
      onSuccess: (response) => {
        toast({
          title: "체험단 등록 완료",
          description: "새로운 체험단이 성공적으로 등록되었습니다.",
        });
        form.reset(createCampaignDefaultValues());
        onSuccess?.(response);
      },
      onError: (error) => {
        toast({
          title: "체험단 등록 실패",
          description: error.message,
          variant: "destructive",
        });

        if (error.code === campaignErrorCodes.validationError) {
          form.setError("title", {
            type: "server",
            message: error.message,
          });
        }
      },
    });
  };

  return (
    <CampaignForm
      form={form}
      submitLabel={submitLabel}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
};
