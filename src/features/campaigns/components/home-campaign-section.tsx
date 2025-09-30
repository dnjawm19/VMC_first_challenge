"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  CAMPAIGN_SORT_OPTIONS,
  CAMPAIGN_STATUS_FILTERS,
} from "@/features/campaigns/constants";
import { useCampaignListQuery } from "@/features/campaigns/hooks/useCampaignListQuery";
import { CampaignFilterBar } from "@/features/campaigns/components/campaign-filter-bar";
import { CampaignList } from "@/features/campaigns/components/campaign-list";

export const HomeCampaignSection = () => {
  const [sort, setSort] = useState<(typeof CAMPAIGN_SORT_OPTIONS)[number]>(
    CAMPAIGN_SORT_OPTIONS[0]
  );
  const [status, setStatus] = useState<(typeof CAMPAIGN_STATUS_FILTERS)[number]>(
    CAMPAIGN_STATUS_FILTERS[0]
  );
  const { toast } = useToast();

  const queryParams = useMemo(
    () => ({ sort, status, page: 1, pageSize: 9 }),
    [sort, status]
  );

  const { data, isLoading, error } = useCampaignListQuery(queryParams);

  const handleSortChange = useCallback(
    (value: (typeof CAMPAIGN_SORT_OPTIONS)[number]) => {
      setSort(value);
    },
    []
  );

  const handleStatusChange = useCallback(
    (value: (typeof CAMPAIGN_STATUS_FILTERS)[number]) => {
      setStatus(value);
    },
    []
  );

  useEffect(() => {
    if (error) {
      toast({
        title: "목록 불러오기 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">모집 중인 체험단</h2>
        <p className="text-sm text-slate-500">
          지금 참여할 수 있는 체험단을 확인해 보세요. 마감 전에 지원하고 혜택을 받아보세요.
        </p>
      </div>
      <CampaignFilterBar
        sort={sort}
        status={status}
        onSortChange={handleSortChange}
        onStatusChange={handleStatusChange}
      />
      <CampaignList
        campaigns={data?.campaigns ?? []}
        isLoading={isLoading}
        errorMessage={error?.message}
      />
    </section>
  );
};
