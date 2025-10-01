"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeCampaignSection } from "@/features/campaigns/components/home-campaign-section";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-12 text-white shadow-lg">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-3xl font-semibold md:text-4xl">우리의 체험단을 한눈에</h1>
          <p className="text-sm text-slate-200">
            다양한 체험단을 탐색하고, 원하는 조건의 캠페인에 참여해 보세요. 광고주는 간편하게 체험단을 등록하고
            인플루언서는 손쉽게 지원할 수 있습니다.
          </p>
          <div className="flex gap-3">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              전체 체험단 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              대시보드 바로가기
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">진행 중인 체험단</h2>
          <p className="text-sm text-slate-500">현재 모집 중인 체험단을 확인하고 바로 지원해 보세요.</p>
        </div>
        <div className="mt-6">
          <HomeCampaignSection />
        </div>
      </section>
    </div>
  );
}
