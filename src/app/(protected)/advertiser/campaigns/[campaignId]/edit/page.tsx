"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getUserRole } from "@/features/auth/lib/get-user-role";
import { useCampaignManagementDetailQuery } from "@/features/campaign-management/hooks/useCampaignManagementDetailQuery";
import { CampaignUpdateForm } from "@/features/campaign-management/components/campaign-update-form";
import { useDeleteCampaignMutation } from "@/features/campaign-management/hooks/useDeleteCampaignMutation";

export default function AdvertiserCampaignEditPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useCurrentUser();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
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
          ? `/login?redirectedFrom=/advertiser/campaigns/${campaignId}/edit`
          : "/login"
      );
    }
  }, [campaignId, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && role !== "advertiser") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, role, router]);

  const detailQuery = useCampaignManagementDetailQuery(campaignId);
  const deleteMutation = useDeleteCampaignMutation(campaignId ?? "");

  useEffect(() => {
    if (detailQuery.error) {
      toast({
        title: "체험단 정보를 불러오지 못했습니다.",
        description: detailQuery.error.message,
        variant: "destructive",
      });
    }
  }, [detailQuery.error, toast]);

  const handleDelete = () => {
    if (!campaignId) {
      return;
    }

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "체험단 삭제 완료",
          description: "체험단이 삭제되었습니다.",
        });
        setDeleteOpen(false);
        router.replace("/advertiser/campaigns");
      },
      onError: (error) => {
        toast({
          title: "체험단 삭제 실패",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  if (!campaignId || !isAuthenticated || role !== "advertiser") {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="h-32 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12 space-y-6">
        <div className="h-12 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-[520px] animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  const detail = detailQuery.data;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">체험단 정보 수정</h1>
          <p className="text-sm text-slate-500">
            체험단 정보를 수정하거나 필요 시 삭제할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/advertiser/campaigns/${campaignId}`}>관리 화면으로 이동</Link>
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "삭제 중" : "체험단 삭제"}
          </Button>
        </div>
      </header>
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <CampaignUpdateForm
          campaignId={campaignId}
          detail={detail}
          onUpdated={() => {
            detailQuery.refetch();
          }}
        />
      </section>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>체험단을 삭제할까요?</DialogTitle>
            <DialogDescription>
              삭제 후에는 되돌릴 수 없으며, 지원자가 있는 체험단은 삭제할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "삭제 중" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
