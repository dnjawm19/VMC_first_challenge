"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCampaignManagementDetailQuery } from "@/features/campaign-management/hooks/useCampaignManagementDetailQuery";
import { useCloseRecruitmentMutation } from "@/features/campaign-management/hooks/useCloseRecruitmentMutation";
import { ApplicantTable } from "@/features/campaign-management/components/applicant-table";
import { SelectionDialog } from "@/features/campaign-management/components/selection-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CAMPAIGN_STATUS_LABELS } from "@/features/campaign-management/constants";

export type CampaignManagementDetailProps = {
  campaignId: string;
};

export const CampaignManagementDetail = ({ campaignId }: CampaignManagementDetailProps) => {
  const { toast } = useToast();
  const { data, isLoading, error } = useCampaignManagementDetailQuery(campaignId);
  const closeMutation = useCloseRecruitmentMutation(campaignId);

  useEffect(() => {
    if (error) {
      toast({
        title: "체험단 정보를 불러오지 못했습니다.",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-[320px] animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  const { campaign, applicants, actions } = data.detail;
  const startDate = format(new Date(campaign.recruitmentStartAt), "yyyy.MM.dd");
  const endDate = format(new Date(campaign.recruitmentEndAt), "yyyy.MM.dd");

  const handleCloseRecruitment = () => {
    closeMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "모집 종료",
          description: "모집 상태가 모집종료로 변경되었습니다.",
        });
      },
      onError: (mutationError) => {
        toast({
          title: "모집 종료 실패",
          description: mutationError.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant={campaign.status === 'recruiting' ? 'default' : 'secondary'}>
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </Badge>
            <h1 className="text-2xl font-semibold text-slate-900">{campaign.title}</h1>
            <p className="text-sm text-slate-500">
              모집 기간 {startDate} ~ {endDate} · 모집 인원 {campaign.capacity}명 · 매장 정보 {campaign.storeInfo}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseRecruitment}
              disabled={!actions.canCloseRecruitment || closeMutation.isPending}
            >
              {closeMutation.isPending ? "모집 종료 중" : "모집 종료"}
            </Button>
            {actions.canSelectApplicants ? (
              <SelectionDialog
                campaignId={campaignId}
                applicants={applicants}
                capacity={actions.capacity}
              />
            ) : null}
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-700">혜택</p>
            <p className="mt-1 whitespace-pre-line">{campaign.benefits}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-700">미션</p>
            <p className="mt-1 whitespace-pre-line">{campaign.mission}</p>
          </div>
        </div>
        {!actions.canCloseRecruitment && campaign.status === 'recruiting' ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            모집 종료는 체험단 선정 이전에 한 번만 수행할 수 있습니다.
          </div>
        ) : null}
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">지원 현황</h2>
          <p className="text-sm text-slate-500">총 {applicants.length}건의 지원서</p>
        </div>
        <ApplicantTable applicants={applicants} />
      </section>
    </div>
  );
};
