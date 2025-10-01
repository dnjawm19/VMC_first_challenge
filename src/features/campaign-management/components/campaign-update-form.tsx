"use client";

import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  CampaignForm,
  useCampaignForm,
  type CampaignFormValues,
} from "@/features/campaign-management/components/campaign-form";
import {
  type CampaignManagementDetail,
  type CampaignManagementDetailResponse,
} from "@/features/campaign-management/backend/schema";
import { useUpdateCampaignMutation } from "@/features/campaign-management/hooks/useUpdateCampaignMutation";

const mapCampaignDetailToFormValues = (
  campaign: CampaignManagementDetail["campaign"],
): CampaignFormValues => ({
  title: campaign.title,
  recruitmentStartAt: campaign.recruitmentStartAt,
  recruitmentEndAt: campaign.recruitmentEndAt,
  capacity: campaign.capacity,
  benefits: campaign.benefits,
  mission: campaign.mission,
  storeInfo: campaign.storeInfo,
  thumbnailUrl: campaign.thumbnailUrl ?? undefined,
});

export type CampaignUpdateFormProps = {
  campaignId: string;
  detail: CampaignManagementDetailResponse;
  onUpdated?: (detail: CampaignManagementDetailResponse) => void;
};

export const CampaignUpdateForm = ({
  campaignId,
  detail,
  onUpdated,
}: CampaignUpdateFormProps) => {
  const { toast } = useToast();
  const mutation = useUpdateCampaignMutation(campaignId);
  const campaign = detail.detail.campaign;

  const defaultValues = useMemo(() => mapCampaignDetailToFormValues(campaign), [campaign]);
  const form = useCampaignForm(defaultValues);
  const isSubmitting = mutation.isPending || form.formState.isSubmitting;

  const handleSubmit = (values: CampaignFormValues) => {
    mutation.mutate(values, {
      onSuccess: (response) => {
        toast({
          title: "체험단 정보 수정 완료",
          description: "체험단 정보가 업데이트되었습니다.",
        });
        form.reset(mapCampaignDetailToFormValues(response.detail.campaign));
        onUpdated?.(response);
      },
      onError: (error) => {
        toast({
          title: "체험단 정보 수정 실패",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <CampaignForm
      form={form}
      submitLabel="체험단 정보 수정"
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
};
