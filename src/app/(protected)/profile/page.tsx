"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserCog, UserPlus } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getUserRole } from "@/features/auth/lib/get-user-role";
import { InfluencerProfileForm } from "@/features/onboarding/components/influencer-profile-form";
import { AdvertiserProfileForm } from "@/features/onboarding/components/advertiser-profile-form";

const LOGIN_REDIRECT_PATH = "/login?redirectedFrom=/profile" as const;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const role = getUserRole(user);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(LOGIN_REDIRECT_PATH);
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (role === "influencer") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2 text-center sm:text-left">
          <h1 className="text-3xl font-semibold text-slate-900">프로필 관리</h1>
          <p className="text-sm text-slate-500">
            체험단 지원을 위한 인플루언서 정보를 관리할 수 있습니다.
          </p>
        </header>
        <InfluencerProfileForm />
      </div>
    );
  }

  if (role === "advertiser") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2 text-center sm:text-left">
          <h1 className="text-3xl font-semibold text-slate-900">프로필 관리</h1>
          <p className="text-sm text-slate-500">
            체험단 운영을 위한 광고주 정보를 관리할 수 있습니다.
          </p>
        </header>
        <AdvertiserProfileForm />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <UserCog className="h-12 w-12 text-slate-400" />
      <h1 className="text-2xl font-semibold text-slate-900">프로필 정보를 불러올 수 없습니다.</h1>
      <p className="text-sm text-slate-500">
        가입 시 선택한 역할 정보를 확인할 수 없어 프로필 페이지를 표시하지 못했습니다. 고객센터에 문의해 주세요.
      </p>
      <UserPlus className="h-8 w-8 text-slate-300" />
    </div>
  );
}
