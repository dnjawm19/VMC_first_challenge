"use client";

import { useMemo } from "react";
import type { CampaignManagementApplicant } from "@/features/campaign-management/backend/schema";
import {
  APPLICATION_STATUS_BADGE_VARIANTS,
  APPLICATION_STATUS_LABELS,
} from "@/features/campaigns/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export type ApplicantTableProps = {
  applicants: CampaignManagementApplicant[];
  selectable?: boolean;
  selectedApplicantIds?: string[];
  onSelectionChange?: (applicantIds: string[]) => void;
};

export const ApplicantTable = ({
  applicants,
  selectable = false,
  selectedApplicantIds = [],
  onSelectionChange,
}: ApplicantTableProps) => {
  const selectedSet = useMemo(() => new Set(selectedApplicantIds), [selectedApplicantIds]);

  const toggleSelection = (applicationId: string, checked: boolean) => {
    if (!onSelectionChange) {
      return;
    }

    const next = new Set(selectedSet);

    if (checked) {
      next.add(applicationId);
    } else {
      next.delete(applicationId);
    }

    onSelectionChange(Array.from(next));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full table-auto text-left">
        <thead className="bg-slate-50 text-sm text-slate-600">
          <tr>
            {selectable ? <th className="w-12 px-4 py-3 font-medium">선택</th> : null}
            <th className="px-4 py-3 font-medium">인플루언서</th>
            <th className="px-4 py-3 font-medium">상태</th>
            <th className="px-4 py-3 font-medium">방문 예정일</th>
            <th className="px-4 py-3 font-medium">신청일</th>
            <th className="px-4 py-3 font-medium">각오 한마디</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
          {applicants.map((applicant) => {
            const submittedAt = format(new Date(applicant.submittedAt), "yyyy.MM.dd");
            const visitPlanDate = format(new Date(applicant.visitPlanDate), "yyyy.MM.dd");
            const variant = APPLICATION_STATUS_BADGE_VARIANTS[applicant.status] ?? "secondary";

            return (
              <tr key={applicant.applicationId} className="bg-white">
                {selectable ? (
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedSet.has(applicant.applicationId)}
                      onCheckedChange={(checked) =>
                        toggleSelection(applicant.applicationId, Boolean(checked))
                      }
                      aria-label="지원자 선택"
                    />
                  </td>
                ) : null}
                <td className="px-4 py-3 font-medium text-slate-900">
                  {applicant.influencerName ?? "이름 미등록"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={variant}>{APPLICATION_STATUS_LABELS[applicant.status]}</Badge>
                </td>
                <td className="px-4 py-3">{visitPlanDate}</td>
                <td className="px-4 py-3">{submittedAt}</td>
                <td className="px-4 py-3 text-slate-600">
                  <p className="line-clamp-2 max-w-xl">{applicant.motivation ?? "미작성"}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
