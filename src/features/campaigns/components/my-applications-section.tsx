"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  APPLICATION_STATUS_FILTERS,
  type ApplicationStatusFilter,
} from "@/features/campaigns/constants";
import { useMyApplicationsQuery } from "@/features/campaigns/hooks/useMyApplicationsQuery";
import { ApplicationStatusFilter as StatusFilter } from "@/features/campaigns/components/application-status-filter";
import { ApplicationList } from "@/features/campaigns/components/application-list";

export const MyApplicationsSection = () => {
  const [status, setStatus] = useState<ApplicationStatusFilter>(APPLICATION_STATUS_FILTERS[0]);
  const { toast } = useToast();

  const queryParams = useMemo(
    () => ({ status: status === "all" ? undefined : status }),
    [status]
  );

  const { data, isLoading, error } = useMyApplicationsQuery(
    queryParams.status ? { status: queryParams.status } : {}
  );

  useEffect(() => {
    if (error) {
      toast({
        title: "내 지원 목록을 불러오지 못했습니다.",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">내 지원 목록</h1>
        <p className="text-sm text-slate-500">
          내가 지원한 체험단의 진행 상태를 확인해 보세요.
        </p>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilter value={status} onChange={setStatus} />
        <p className="text-sm text-slate-500">
          {data?.items.length ?? 0}개의 지원 내역이 있습니다.
        </p>
      </div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`applications-skeleton-${index}`}
              className="h-[240px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <ApplicationList items={data?.items ?? []} />
      )}
    </section>
  );
};
