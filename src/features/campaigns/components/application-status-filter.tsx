"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPLICATION_STATUS_FILTERS,
  APPLICATION_STATUS_LABELS,
  type ApplicationStatusFilter,
} from "@/features/campaigns/constants";
import { useMemo } from "react";

export type ApplicationStatusFilterProps = {
  value: ApplicationStatusFilter;
  onChange: (value: ApplicationStatusFilter) => void;
};

export const ApplicationStatusFilterComponent = ({
  value,
  onChange,
}: ApplicationStatusFilterProps) => {
  const options = useMemo(() => APPLICATION_STATUS_FILTERS, []);

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ApplicationStatusFilter)}
    >
      <SelectTrigger className="w-full sm:w-[160px]">
        <SelectValue placeholder="상태 필터" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {APPLICATION_STATUS_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
