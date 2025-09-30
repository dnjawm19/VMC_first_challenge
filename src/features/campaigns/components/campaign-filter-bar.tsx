"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CAMPAIGN_SORT_LABELS,
  CAMPAIGN_SORT_OPTIONS,
  CAMPAIGN_STATUS_FILTERS,
  CAMPAIGN_STATUS_LABELS,
} from "@/features/campaigns/constants";

export type CampaignFilterBarProps = {
  sort: (typeof CAMPAIGN_SORT_OPTIONS)[number];
  status: (typeof CAMPAIGN_STATUS_FILTERS)[number];
  onSortChange: (value: (typeof CAMPAIGN_SORT_OPTIONS)[number]) => void;
  onStatusChange: (value: (typeof CAMPAIGN_STATUS_FILTERS)[number]) => void;
};

export const CampaignFilterBar = ({
  sort,
  status,
  onSortChange,
  onStatusChange,
}: CampaignFilterBarProps) => {
  const sortOptions = useMemo(() => CAMPAIGN_SORT_OPTIONS, []);
  const statusOptions = useMemo(() => CAMPAIGN_STATUS_FILTERS, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-500">
        원하는 체험단을 빠르게 찾을 수 있도록 정렬과 필터를 조정해 보세요.
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Select value={status} onValueChange={(value) => onStatusChange(value as (typeof CAMPAIGN_STATUS_FILTERS)[number])}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {CAMPAIGN_STATUS_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => onSortChange(value as (typeof CAMPAIGN_SORT_OPTIONS)[number])}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {CAMPAIGN_SORT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
