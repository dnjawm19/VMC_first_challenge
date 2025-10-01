"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getUserRole } from "@/features/auth/lib/get-user-role";
import { CampaignCreateForm } from "@/features/campaign-management/components/campaign-create-form";

type CampaignCreatePageProps = {
  params: Promise<Record<string, never>>;
};

const DASHBOARD_REDIRECT_PATH = "/advertiser/campaigns" as const;
const LOGIN_REDIRECT_PATH = "/login" as const;
const ROLE_ADVERTISER = "advertiser" as const;

export default function AdvertiserCampaignCreatePage({ params }: CampaignCreatePageProps) {
  useEffect(() => {
    params.then(() => undefined);
  }, [params]);

  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useCurrentUser();
  const role = getUserRole(user);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`${LOGIN_REDIRECT_PATH}?redirectedFrom=/advertiser/campaigns/new`);
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && role !== ROLE_ADVERTISER) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, role, router]);

  if (!isAuthenticated || role !== ROLE_ADVERTISER) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-3 text-center">
        <ClipboardPlus className="mx-auto h-12 w-12 text-slate-400" />
        <h1 className="text-2xl font-semibold text-slate-900">체험단 생성</h1>
        <p className="text-sm text-slate-500">
          모집 기간, 혜택, 미션을 입력하고 새로운 체험단을 등록하세요.
        </p>
      </header>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <CampaignCreateForm
          submitLabel="체험단 등록하기"
          onSuccess={(response) => {
            router.replace(`${DASHBOARD_REDIRECT_PATH}/${response.campaignId}`);
          }}
        />
      </section>
    </div>
  );
}
