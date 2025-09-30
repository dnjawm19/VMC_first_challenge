"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness } from "lucide-react";
import { AdvertiserProfileForm } from "@/features/onboarding/components/advertiser-profile-form";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

type PageProps = {
  params: Promise<Record<string, string>>;
};

export default function AdvertiserOnboardingPage({ params }: PageProps) {
  void params;
  const router = useRouter();
  const { user, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login?redirectedFrom=/onboarding/advertiser");
      return;
    }

    const role = user?.appMetadata?.role;

    if (role && role !== "advertiser") {
      router.replace("/");
    }
  }, [isAuthenticated, router, user?.appMetadata?.role]);

  if (!isAuthenticated) {
    return null;
  }

  const role = user?.appMetadata?.role;

  if (role && role !== "advertiser") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
        <BriefcaseBusiness className="h-12 w-12 text-slate-400" />
        <h1 className="text-2xl font-semibold">광고주 전용 화면입니다.</h1>
        <p className="text-sm text-slate-500">
          광고주 계정으로 로그인하여 정보를 등록해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <AdvertiserProfileForm />
    </div>
  );
}
