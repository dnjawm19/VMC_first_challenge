"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPen } from "lucide-react";
import { CampaignApplicationForm } from "@/features/campaigns/components/campaign-application-form";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

type CampaignApplyPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default function CampaignApplyPage({ params }: CampaignApplyPageProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useCurrentUser();
  const [campaignId, setCampaignId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    params.then((resolved) => {
      if (mounted) {
        setCampaignId(resolved.campaignId);
      }
    });

    return () => {
      mounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(
        campaignId
          ? `/login?redirectedFrom=/campaigns/${campaignId}/apply`
          : `/login`
      );
    }
  }, [campaignId, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.appMetadata?.role !== "influencer") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router, user?.appMetadata?.role]);

  if (!campaignId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="h-[320px] animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (!isAuthenticated || user?.appMetadata?.role !== "influencer") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 space-y-8">
      <header className="space-y-3 text-center">
        <ClipboardPen className="mx-auto h-12 w-12 text-slate-400" />
        <h1 className="text-2xl font-semibold text-slate-900">체험단 지원서 작성</h1>
        <p className="text-sm text-slate-500">
          각오 한마디와 방문 예정일을 입력하면 담당자가 지원서를 검토합니다.
        </p>
      </header>
      <CampaignApplicationForm campaignId={campaignId} />
    </div>
  );
}
