"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CAMPAIGN_DEFAULT_PAGE_SIZE,
  CAMPAIGN_SORT_OPTIONS,
  CAMPAIGN_STATUS_FILTERS,
} from "@/features/campaigns/constants";
import { CampaignFilterBar } from "@/features/campaigns/components/campaign-filter-bar";
import { CampaignList } from "@/features/campaigns/components/campaign-list";
import { useCampaignListQuery } from "@/features/campaigns/hooks/useCampaignListQuery";

const CAMPAIGNS_PATH = "/campaigns" as const;
const SORT_PARAM_KEY = "sort" as const;
const STATUS_PARAM_KEY = "status" as const;
const PAGE_PARAM_KEY = "page" as const;
const DEFAULT_SORT = CAMPAIGN_SORT_OPTIONS[0];
const DEFAULT_STATUS = CAMPAIGN_STATUS_FILTERS[0];
const DEFAULT_PAGE = 1;
const PREVIOUS_BUTTON_LABEL = "이전 페이지" as const;
const NEXT_BUTTON_LABEL = "다음 페이지" as const;

const parseSort = (value: string | null) =>
  value && CAMPAIGN_SORT_OPTIONS.includes(value as (typeof CAMPAIGN_SORT_OPTIONS)[number])
    ? (value as (typeof CAMPAIGN_SORT_OPTIONS)[number])
    : DEFAULT_SORT;

const parseStatus = (value: string | null) =>
  value && CAMPAIGN_STATUS_FILTERS.includes(value as (typeof CAMPAIGN_STATUS_FILTERS)[number])
    ? (value as (typeof CAMPAIGN_STATUS_FILTERS)[number])
    : DEFAULT_STATUS;

const parsePage = (value: string | null) => {
  if (!value) {
    return DEFAULT_PAGE;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < DEFAULT_PAGE) {
    return DEFAULT_PAGE;
  }

  return parsed;
};

type CampaignsPageProps = {
  params: Promise<Record<string, never>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function CampaignsPage({ params, searchParams }: CampaignsPageProps) {
  useEffect(() => {
    params.then(() => undefined);
  }, [params]);

  useEffect(() => {
    searchParams.then(() => undefined);
  }, [searchParams]);

  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const { toast } = useToast();

  const sort = useMemo(
    () => parseSort(urlSearchParams.get(SORT_PARAM_KEY)),
    [urlSearchParams],
  );

  const status = useMemo(
    () => parseStatus(urlSearchParams.get(STATUS_PARAM_KEY)),
    [urlSearchParams],
  );

  const page = useMemo(
    () => parsePage(urlSearchParams.get(PAGE_PARAM_KEY)),
    [urlSearchParams],
  );

  const queryParams = useMemo(
    () => ({
      sort,
      status,
      page,
      pageSize: CAMPAIGN_DEFAULT_PAGE_SIZE,
    }),
    [page, sort, status],
  );

  const { data, isLoading, error } = useCampaignListQuery(queryParams);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast({
      title: "체험단 목록을 불러오지 못했습니다.",
      description: error.message,
      variant: "destructive",
    });
  }, [error, toast]);

  const updateQuery = useCallback(
    (
      next: Partial<{
        sort: (typeof CAMPAIGN_SORT_OPTIONS)[number];
        status: (typeof CAMPAIGN_STATUS_FILTERS)[number];
        page: number;
      }>,
    ) => {
      const search = new URLSearchParams(urlSearchParams.toString());
      const nextSort = next.sort ?? sort;
      const nextStatus = next.status ?? status;
      const nextPage = next.page ?? page;

      if (nextSort === DEFAULT_SORT) {
        search.delete(SORT_PARAM_KEY);
      } else {
        search.set(SORT_PARAM_KEY, nextSort);
      }

      if (nextStatus === DEFAULT_STATUS) {
        search.delete(STATUS_PARAM_KEY);
      } else {
        search.set(STATUS_PARAM_KEY, nextStatus);
      }

      if (nextPage === DEFAULT_PAGE) {
        search.delete(PAGE_PARAM_KEY);
      } else {
        search.set(PAGE_PARAM_KEY, String(nextPage));
      }

      const queryString = search.toString();
      router.push(queryString ? `${CAMPAIGNS_PATH}?${queryString}` : CAMPAIGNS_PATH);
    },
    [page, router, sort, status, urlSearchParams],
  );

  const handleSortChange = useCallback(
    (value: (typeof CAMPAIGN_SORT_OPTIONS)[number]) => {
      updateQuery({ sort: value, page: DEFAULT_PAGE });
    },
    [updateQuery],
  );

  const handleStatusChange = useCallback(
    (value: (typeof CAMPAIGN_STATUS_FILTERS)[number]) => {
      updateQuery({ status: value, page: DEFAULT_PAGE });
    },
    [updateQuery],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      updateQuery({ page: nextPage });
    },
    [updateQuery],
  );

  const total = data?.pagination.total ?? 0;
  const hasNextPage = data?.pagination.hasNextPage ?? false;
  const totalPages = useMemo(() => {
    if (!data) {
      return DEFAULT_PAGE;
    }

    const calculated = Math.ceil(
      data.pagination.total / data.pagination.pageSize,
    );

    return calculated > 0 ? calculated : DEFAULT_PAGE;
  }, [data]);

  const canGoPrevious = page > DEFAULT_PAGE;
  const canGoNext = hasNextPage;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold">전체 체험단</h1>
          <p className="text-sm text-slate-500">
            원하는 조건으로 체험단을 찾아보고 바로 지원해 보세요.
          </p>
        </header>
        <CampaignFilterBar
          sort={sort}
          status={status}
          onSortChange={handleSortChange}
          onStatusChange={handleStatusChange}
        />
        <div className="space-y-4">
          <CampaignList
            campaigns={data?.campaigns ?? []}
            isLoading={isLoading}
            errorMessage={error?.message}
          />
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center">
            <span>
              총 <strong>{total}</strong>개의 체험단이 있습니다.
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoPrevious}
                onClick={() => handlePageChange(page - 1)}
              >
                {PREVIOUS_BUTTON_LABEL}
              </Button>
              <span className="text-xs text-slate-500">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                onClick={() => handlePageChange(page + 1)}
              >
                {NEXT_BUTTON_LABEL}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
