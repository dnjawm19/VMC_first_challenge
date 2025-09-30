"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MyApplicationsSection } from "@/features/campaigns/components/my-applications-section";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export default function MyApplicationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?redirectedFrom=/applications");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.appMetadata?.role !== "influencer") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router, user?.appMetadata?.role]);

  if (!isAuthenticated || user?.appMetadata?.role !== "influencer") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <MyApplicationsSection />
    </div>
  );
}
