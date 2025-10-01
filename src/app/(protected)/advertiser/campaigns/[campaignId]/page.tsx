"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getUserRole } from "@/features/auth/lib/get-user-role";
import { CampaignManagementDetail } from "@/features/campaign-management/components/campaign-management-detail";

export default function AdvertiserCampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useCurrentUser();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const role = getUserRole(user);

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
          ? `/login?redirectedFrom=/advertiser/campaigns/${campaignId}`
          : "/login"
      );
    }
  }, [campaignId, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && role !== "advertiser") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, role, router]);

  if (!campaignId || !isAuthenticated || role !== "advertiser") {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="h-32 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <CampaignManagementDetail campaignId={campaignId} />
    </div>
  );
}
