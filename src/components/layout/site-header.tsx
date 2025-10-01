"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getUserRole } from "@/features/auth/lib/get-user-role";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const NAV_BASE = [
  { href: "/", label: "홈" },
  { href: "/campaigns", label: "체험단" },
];

const NAV_FALLBACK = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/profile", label: "프로필" },
];

const buildNavLinks = (role: string | null, isAuthenticated: boolean) => {
  const links = [...NAV_BASE];

  if (role === "influencer") {
    links.push({ href: "/applications", label: "내 지원" });
  }

  if (role === "advertiser") {
    links.push({ href: "/advertiser/campaigns", label: "체험단 관리" });
  }

  if (isAuthenticated) {
    NAV_FALLBACK.forEach((item) => {
      if (!links.find((link) => link.href === item.href)) {
        links.push(item);
      }
    });
  }

  return links;
};

export const SiteHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const role = getUserRole(user);

  const navLinks = useMemo(
    () => buildNavLinks(role, isAuthenticated),
    [isAuthenticated, role],
  );

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  const authActions = useMemo(() => {
    if (isLoading) {
      return <span className="text-sm text-slate-400">세션 확인 중...</span>;
    }

    if (isAuthenticated && user) {
      return (
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-100"
          >
            <UserCircle className="h-4 w-4" />
            {user.email ?? "알 수 없는 사용자"}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-slate-600 hover:text-slate-900"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-slate-600 transition hover:text-slate-900"
        >
          로그인
        </Link>
        <Button asChild size="sm" className="gap-1">
          <Link href="/signup">회원가입</Link>
        </Button>
      </div>
    );
  }, [handleSignOut, isAuthenticated, isLoading, user]);

  const renderNavLinks = (variant: "desktop" | "mobile") => (
    <nav className={variant === "desktop" ? "hidden gap-6 md:flex" : "flex flex-col gap-3"}>
      {navLinks.map((link) => {
        const isActive = link.href === "/"
          ? pathname === link.href
          : pathname.startsWith(link.href);

        const baseClasses = "text-sm transition";
        const activeClasses = isActive
          ? "text-slate-900 font-semibold"
          : "text-slate-600 hover:text-slate-900";

        return (
          <Link key={link.href} href={link.href} className={`${baseClasses} ${activeClasses}`}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold text-slate-900 md:text-lg">
            VMC Experience
          </Link>
          {renderNavLinks("desktop")}
        </div>
        <div className="hidden md:block">{authActions}</div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="메뉴 열기"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col gap-6">
            {renderNavLinks("mobile")}
            <div className="border-t border-slate-200 pt-4">{authActions}</div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default SiteHeader;
