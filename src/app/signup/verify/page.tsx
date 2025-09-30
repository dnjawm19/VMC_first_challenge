"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const MAIL_RESEND_INTERVAL_MS = 30_000;

type VerifySignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function VerifySignupPage({ params }: VerifySignupPageProps) {
  void params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const email = searchParams.get("email") ?? "";
  const [isSending, setIsSending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  const isResendDisabled = useMemo(() => {
    if (isSending) {
      return true;
    }

    if (!lastSentAt) {
      return false;
    }

    return Date.now() - lastSentAt < MAIL_RESEND_INTERVAL_MS;
  }, [isSending, lastSentAt]);

  const handleResend = useCallback(async () => {
    if (!email) {
      toast({
        title: "재전송 불가",
        description: "확인할 이메일 정보가 없습니다. 다시 회원가입을 진행해 주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        toast({
          title: "메일 재전송 실패",
          description: error.message ?? "인증 메일 재전송에 실패했습니다.",
          variant: "destructive",
        });
        return;
      }

      setLastSentAt(Date.now());
      toast({
        title: "메일 재전송 완료",
        description: `${email} 주소로 인증 메일을 다시 보냈습니다.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "인증 메일을 다시 보내는 데 실패했습니다.";

      toast({
        title: "메일 재전송 실패",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [email, toast]);

  const handleBackToSignup = useCallback(() => {
    router.push("/signup");
  }, [router]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-12 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="h-12 w-12 text-slate-500" />
        <h1 className="text-3xl font-semibold">이메일 인증을 완료해 주세요</h1>
        <p className="text-sm text-slate-500">
          {email
            ? `${email} 주소로 인증 메일을 보냈습니다. 메일함을 확인하고 링크를 클릭해 계정을 활성화해 주세요.`
            : "인증 메일을 보냈습니다. 메일함을 확인해 주세요."}
        </p>
      </header>
      <div className="grid w-full items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">다음 단계를 따라 주세요</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>메일함에서 Supabase 또는 체험단 플랫폼 발신 메일을 확인합니다.</li>
              <li>메일 본문에 포함된 인증 링크를 클릭하면 가입이 완료됩니다.</li>
              <li>메일이 보이지 않는 경우 스팸함이나 프로모션 탭을 확인해 주세요.</li>
            </ol>
          </div>
          <div className="flex flex-col gap-3 text-sm text-slate-500">
            <p>메일을 받지 못했다면 아래 버튼을 눌러 인증 메일을 다시 보낼 수 있습니다.</p>
            <p>입력한 이메일이 정확하지 않다면 다시 회원가입을 진행해 주세요.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={handleResend}
              disabled={isResendDisabled}
            >
              <RefreshCcw className="h-4 w-4" />
              {isSending
                ? "메일 전송 중"
                : isResendDisabled
                  ? "잠시 후 다시 시도해 주세요"
                  : "인증 메일 다시 보내기"}
            </Button>
            <Button type="button" variant="ghost" onClick={handleBackToSignup}>
              다른 이메일로 다시 가입하기
            </Button>
          </div>
        </section>
        <figure className="hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
          <Image
            src="https://picsum.photos/seed/signup-verify/640/800"
            alt="이메일을 확인하는 사람"
            width={640}
            height={800}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>
      <footer className="text-sm text-slate-500">
        이미 인증을 마치셨다면{" "}
        <Link href="/login" className="font-medium text-slate-700 underline hover:text-slate-900">
          로그인 화면으로 이동하세요.
        </Link>
      </footer>
    </div>
  );
}
