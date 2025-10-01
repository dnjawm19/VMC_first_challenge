"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { PlusCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdvertiserCampaignSortOption,
  CampaignStatusOption,
  ADVERTISER_CAMPAIGN_SORT_OPTIONS,
  CAMPAIGN_STATUS_OPTIONS,
  ADVERTISER_CAMPAIGN_SORT_LABELS,
  CAMPAIGN_STATUS_LABELS,
} from "@/features/campaign-management/constants";
import { useAdvertiserCampaignsQuery } from "@/features/campaign-management/hooks/useAdvertiserCampaignsQuery";
import { match } from "ts-pattern";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const placeholderImage = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}-advertiser/640/400`;

export const AdvertiserCampaignDashboard = () => {
  const { toast } = useToast();
  const [sort, setSort] = useState<AdvertiserCampaignSortOption>(
    ADVERTISER_CAMPAIGN_SORT_OPTIONS[0]
  );
  const [status, setStatus] = useState<CampaignStatusOption | undefined>();

  const query = useMemo(
    () => ({ sort, status }),
    [sort, status]
  );

  const { data, isLoading, error } = useAdvertiserCampaignsQuery(query);
  const campaignItems = data?.items ?? [];
  const isVerified = data?.meta.verified ?? true;

  useEffect(() => {
    if (error) {
      toast({
        title: "체험단 목록을 불러오지 못했습니다.",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const renderCreateButton = (options?: { disabled?: boolean }) => {
    const disabled = options?.disabled ?? !isVerified;

    return match(disabled)
      .with(true, () => (
        <Button type="button" disabled>
          신규 체험단 등록
        </Button>
      ))
      .otherwise(() => (
        <Button asChild>
          <Link href="/advertiser/campaigns/new">신규 체험단 등록</Link>
        </Button>
      ));
  };

  if (error) {
    const needsProfile = error.message.includes('광고주 정보 등록');

    return (
      <section className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">체험단 관리</h1>
            <p className="text-sm text-slate-500">
              등록한 체험단을 확인하고 새로운 체험단을 생성할 수 있습니다.
            </p>
          </div>
          {renderCreateButton({ disabled: true })}
        </header>
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-900">
              {needsProfile ? '광고주 정보를 먼저 등록해 주세요.' : '체험단 목록을 불러올 수 없습니다.'}
            </p>
            <p className="text-sm text-slate-500">
              {needsProfile
                ? '사업자 정보를 등록하면 체험단 관리 대시보드를 이용할 수 있습니다.'
                : error.message}
            </p>
          </div>
          {needsProfile ? (
            <Link
              href="/onboarding/advertiser"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              광고주 정보 등록하기
              <PlusCircle className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">체험단 관리</h1>
          <p className="text-sm text-slate-500">
            등록한 체험단을 확인하고 새로운 체험단을 생성할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sort} onValueChange={(value) => setSort(value as AdvertiserCampaignSortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              {ADVERTISER_CAMPAIGN_SORT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {ADVERTISER_CAMPAIGN_SORT_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status ?? "all"}
            onValueChange={(value) =>
              setStatus(value === "all" ? undefined : (value as CampaignStatusOption))
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              {CAMPAIGN_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {CAMPAIGN_STATUS_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renderCreateButton()}
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`campaign-dashboard-skeleton-${index}`}
              className="h-[260px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : campaignItems.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <PlusCircle className="h-12 w-12 text-slate-400" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-900">등록된 체험단이 없습니다.</p>
            <p className="text-sm text-slate-500">
              신규 체험단을 등록하고 인플루언서를 모집해 보세요.
            </p>
          </div>
          {renderCreateButton()}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {campaignItems.map((campaign) => {
            const thumbnail = placeholderImage(campaign.id);
            const dateLabel = `${format(new Date(campaign.recruitmentStartAt), "yyyy.MM.dd")}
              ~ ${format(new Date(campaign.recruitmentEndAt), "yyyy.MM.dd")}`;

            return (
              <article
                key={campaign.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <Link href={`/advertiser/campaigns/${campaign.id}`} className="relative block aspect-[3/2]">
                  <Image
                    src={thumbnail}
                    alt={campaign.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </Link>
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <Badge variant={campaign.status === "recruiting" ? "default" : "secondary"}>
                      {CAMPAIGN_STATUS_LABELS[campaign.status]}
                    </Badge>
                    <span className="text-xs text-slate-500">모집 기간 {dateLabel}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 line-clamp-2">
                    <Link href={`/advertiser/campaigns/${campaign.id}`}>{campaign.title}</Link>
                  </h2>
                  <p className="text-sm text-slate-600 line-clamp-2">미션: {campaign.mission}</p>
                  <p className="text-sm text-slate-600 line-clamp-2">혜택: {campaign.benefits}</p>
                  <p className="text-xs text-slate-500">등록일 {format(new Date(campaign.createdAt), "yyyy.MM.dd")}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
