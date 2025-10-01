"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" disabled={!hasSelectableApplicants}>
          체험단 선정
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100vh-4rem)] flex-col gap-6 overflow-hidden p-0 sm:p-0">
        <div className="flex flex-col gap-6 p-6">
          <DialogHeader className="text-left">
            <DialogTitle>체험단 선정</DialogTitle>
            <DialogDescription>
              선정할 인원을 선택하고 확인을 눌러 주세요. 최대 {capacity}명까지 선정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-xl border border-slate-200">
            {hasSelectableApplicants ? (
              <div className="h-full overflow-auto">
                <ApplicantTable
                  applicants={selectableApplicants}
                  selectable
                  selectedApplicantIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center bg-slate-50 p-6 text-sm text-slate-600">
                선정 가능한 지원자가 없습니다. 모집을 종료한 후 지원자를 기다려 주세요.
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex w-full flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">선택된 지원자 {selectedIds.length}명 / 모집 인원 {capacity}명</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              취소
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={mutation.isPending}>
              {mutation.isPending ? "선정 중" : "선정 확정"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
