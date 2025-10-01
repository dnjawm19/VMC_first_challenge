"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MyApplicationsResponse } from "@/features/campaigns/backend/schema";
import {
  APPLICATION_STATUS_BADGE_VARIANTS,
  APPLICATION_STATUS_LABELS,
} from "@/features/campaigns/constants";

export type ApplicationListProps = {
  items: MyApplicationsResponse["items"];
};

const placeholderImage = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}-application/480/320`;

export const ApplicationList = ({ items }: ApplicationListProps) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        아직 지원한 체험단이 없습니다. 다양한 체험단을 탐색하고 지원해 보세요.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => {
        const thumbnail = item.campaign.thumbnailUrl ?? placeholderImage(item.campaign.id);
        const submittedAt = format(new Date(item.submittedAt), "yyyy.MM.dd");
        const visitPlan = format(new Date(item.visitPlanDate), "yyyy.MM.dd");
        const variant = APPLICATION_STATUS_BADGE_VARIANTS[item.status];

        return (
          <article
            key={item.applicationId}
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <Link href={`/campaigns/${item.campaign.id}`} className="relative block aspect-[3/2]">
              <Image
                src={thumbnail}
                alt={item.campaign.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </Link>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <Badge variant={variant}>
                  {APPLICATION_STATUS_LABELS[item.status]}
                </Badge>
                <span className="text-xs text-slate-500">신청일 {submittedAt}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                <Link href={`/campaigns/${item.campaign.id}`}>{item.campaign.title}</Link>
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2">미션: {item.campaign.mission}</p>
              <p className="text-sm text-slate-600 line-clamp-2">혜택: {item.campaign.benefits}</p>
              <div className="mt-auto text-xs text-slate-500">
                방문 예정일 {visitPlan}
              </div>
              <div className="flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/campaigns/${item.campaign.id}/apply`}>
                    지원 내용 수정
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
