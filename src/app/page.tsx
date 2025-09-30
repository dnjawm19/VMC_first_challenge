"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  CheckCircle2,
  Boxes,
  Database,
  LogOut,
  Server,
  ArrowRight,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { HomeCampaignSection } from "@/features/campaigns/components/home-campaign-section";

export default function Home() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  const authActions = useMemo(() => {
    if (isLoading) {
      return <span className="text-sm text-slate-300">세션 확인 중...</span>;
    }

    if (isAuthenticated && user) {
      return (
        <div className="flex items-center gap-3 text-sm text-slate-200">
          <span className="truncate">{user.email ?? "알 수 없는 사용자"}</span>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-600 px-3 py-1 transition hover:border-slate-400 hover:bg-slate-800"
            >
              대시보드
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1 text-slate-900 transition hover:bg-white"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/login"
          className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 transition hover:border-slate-400 hover:bg-slate-800"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-slate-100 px-3 py-1 text-slate-900 transition hover:bg-white"
        >
          회원가입
        </Link>
      </div>
    );
  }, [handleSignOut, isAuthenticated, isLoading, user]);

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    window.setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-4">
          <div className="text-sm font-medium text-slate-300">
            VMC First Challenge
          </div>
          {authActions}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl">
          <HomeCampaignSection />
          <div className="mt-6 flex justify-end">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              전체 체험단 목록 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
