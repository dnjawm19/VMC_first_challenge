"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ApplicantTable } from "@/features/campaign-management/components/applicant-table";
import type { CampaignManagementApplicant } from "@/features/campaign-management/backend/schema";
import { useSelectApplicantsMutation } from "@/features/campaign-management/hooks/useSelectApplicantsMutation";
import { useToast } from "@/hooks/use-toast";

export type SelectionDialogProps = {
  campaignId: string;
  applicants: CampaignManagementApplicant[];
  capacity: number;
};

export const SelectionDialog = ({ campaignId, applicants, capacity }: SelectionDialogProps) => {
  const { toast } = useToast();
  const mutation = useSelectApplicantsMutation(campaignId);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
    }
  }, [open]);

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      toast({
        title: "선정할 지원자를 선택해 주세요.",
        description: "최소 한 명 이상의 지원자를 선택해야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (capacity && selectedIds.length > capacity) {
      toast({
        title: "선정 인원이 모집 인원을 초과했습니다.",
        description: `최대 ${capacity}명까지 선정할 수 있습니다.`,
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(selectedIds, {
      onSuccess: () => {
        toast({
          title: "선정 완료",
          description: "선정 결과가 저장되었습니다.",
        });
        setOpen(false);
      },
      onError: (error) => {
        toast({
          title: "선정 실패",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const selectableApplicants = applicants.filter((applicant) => applicant.status === 'applied');
  const hasSelectableApplicants = selectableApplicants.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="secondary" disabled={!hasSelectableApplicants}>
          체험단 선정
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full flex-col gap-6 overflow-hidden">
        <SheetHeader>
          <SheetTitle>체험단 선정</SheetTitle>
          <SheetDescription>
            선정할 인원을 선택하고 확인을 눌러 주세요. 최대 {capacity}명까지 선정할 수 있습니다.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto">
          {hasSelectableApplicants ? (
            <ApplicantTable
              applicants={selectableApplicants}
              selectable
              selectedApplicantIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              선정 가능한 지원자가 없습니다. 모집을 종료한 후 지원자를 기다려 주세요.
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">선택된 지원자 {selectedIds.length}명 / 모집 인원 {capacity}명</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              취소
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={mutation.isPending}>
              {mutation.isPending ? "선정 중" : "선정 확정"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
