"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CampaignSummary } from "@/features/campaigns/lib/dto";
import {
  CAMPAIGN_STATUS_LABELS,
} from "@/features/campaigns/constants";

export type CampaignListProps = {
  campaigns: CampaignSummary[];
  isLoading: boolean;
  errorMessage?: string | null;
};

const buildPlaceholderImage = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/480/320`;

export const CampaignList = ({ campaigns, isLoading, errorMessage }: CampaignListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`campaign-skeleton-${index}`}
            className="h-[320px] animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600">
        {errorMessage}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        현재 조건에 맞는 체험단이 없습니다. 다른 필터를 시도해 보세요.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => {
        const thumbnail = campaign.thumbnailUrl ?? buildPlaceholderImage(campaign.id);
        const endDateLabel = format(new Date(campaign.recruitmentEndAt), "yyyy.MM.dd");

        return (
          <Card key={campaign.id} className="flex h-full flex-col overflow-hidden">
            <Link href={`/campaigns/${campaign.id}`} className="relative block aspect-[3/2]">
              <Image
                src={thumbnail}
                alt={campaign.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={false}
              />
            </Link>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={campaign.status === 'recruiting' ? 'default' : 'secondary'}>
                  {CAMPAIGN_STATUS_LABELS[campaign.status]}
                </Badge>
                <span className="text-xs text-slate-500">마감 {endDateLabel}</span>
              </div>
              <CardTitle className="text-lg font-semibold leading-snug line-clamp-2">
                <Link href={`/campaigns/${campaign.id}`}>{campaign.title}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 text-sm text-slate-600">
              <p className="line-clamp-2">혜택: {campaign.benefits}</p>
              <p className="line-clamp-2">미션: {campaign.mission}</p>
              <p className="mt-auto text-xs text-slate-500">모집인원 {campaign.capacity}명 · 장소 {campaign.storeInfo}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
