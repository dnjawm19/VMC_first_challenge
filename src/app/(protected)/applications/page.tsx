"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MyApplicationsSection } from "@/features/campaigns/components/my-applications-section";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getUserRole } from "@/features/auth/lib/get-user-role";

export default function MyApplicationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useCurrentUser();
  const role = getUserRole(user);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?redirectedFrom=/applications");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && role !== "influencer") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, role, router]);

  if (!isAuthenticated || role !== "influencer") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <MyApplicationsSection />
    </div>
  );
}
