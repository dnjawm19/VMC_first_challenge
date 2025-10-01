"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { match } from "ts-pattern";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { MyApplicationsSection } from "@/features/campaigns/components/my-applications-section";
import { AdvertiserCampaignDashboard } from "@/features/campaign-management/components/advertiser-campaign-dashboard";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

const ROLE_INFLUENCER = "influencer" as const;
const ROLE_ADVERTISER = "advertiser" as const;
const CAMPAIGNS_PATH = "/campaigns" as const;
const ADVERTISER_ONBOARDING_PATH = "/onboarding/advertiser" as const;
const INFLUENCER_ONBOARDING_PATH = "/onboarding/influencer" as const;

export default function DashboardPage({ params }: DashboardPageProps) {
  useEffect(() => {
    params.then(() => undefined);
  }, [params]);

  const { user, isAuthenticated, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
        <div className="h-12 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="aspect-[16/7] w-full animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={`dashboard-skeleton-${index}`} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const role = user?.appMetadata?.role ?? null;
  const email = user?.email ?? "알 수 없는 사용자";

  const roleContent = match(role)
    .with(ROLE_INFLUENCER, () => (
      <div className="space-y-10">
        <MyApplicationsSection />
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">새로운 체험단 찾기</h2>
            <p className="text-sm text-slate-500">
              원하는 조건의 체험단을 탐색하고 지원서를 수정하거나 새로 제출해 보세요.
            </p>
          </div>
          <Button asChild>
            <Link href={CAMPAIGNS_PATH}>전체 체험단 보기</Link>
          </Button>
        </section>
      </div>
    ))
    .with(ROLE_ADVERTISER, () => <AdvertiserCampaignDashboard />)
    .otherwise(() => (
      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">역할 설정 필요</h2>
          <p className="mt-2 text-sm text-slate-500">
            먼저 인플루언서 또는 광고주 정보를 등록하면 대시보드 기능을 이용할 수 있습니다.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={INFLUENCER_ONBOARDING_PATH}>인플루언서 정보 등록</Link>
            </Button>
            <Button asChild>
              <Link href={ADVERTISER_ONBOARDING_PATH}>광고주 정보 등록</Link>
            </Button>
          </div>
        </div>
      </section>
    ));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">대시보드</h1>
        <p className="text-sm text-slate-500">{email} 님, 환영합니다.</p>
      </header>
      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <Image
          alt="대시보드"
          src="https://picsum.photos/seed/dashboard/1200/480"
          width={1200}
          height={480}
          className="h-auto w-full object-cover"
        />
      </div>
      {roleContent}
    </div>
  );
}
