"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdvertiserCampaignDashboard } from "@/features/campaign-management/components/advertiser-campaign-dashboard";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getUserRole } from "@/features/auth/lib/get-user-role";

export default function AdvertiserCampaignsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useCurrentUser();
  const role = getUserRole(user);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?redirectedFrom=/advertiser/campaigns");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && role !== "advertiser") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, role, router]);

  if (!isAuthenticated || role !== "advertiser") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <AdvertiserCampaignDashboard />
    </div>
  );
}
