"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, Users, MapPin, Gift, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCampaignDetailQuery } from "@/features/campaigns/hooks/useCampaignDetailQuery";
import { useCampaignEligibility } from "@/features/campaigns/hooks/useCampaignEligibility";
import { CAMPAIGN_STATUS_LABELS } from "@/features/campaigns/constants";

const placeholderImage = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}-detail/960/640`;

export type CampaignDetailSectionProps = {
  campaignId: string;
};

export const CampaignDetailSection = ({ campaignId }: CampaignDetailSectionProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const { data, isLoading, error } = useCampaignDetailQuery(campaignId);
  const eligibility = useCampaignEligibility(data?.eligibility);

  useEffect(() => {
    if (error) {
      toast({
        title: "체험단 정보를 불러오지 못했습니다.",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading || !data) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />
        <div className="space-y-4">
          <div className="h-8 animate-pulse rounded-lg bg-slate-200" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`detail-skeleton-${index}`} className="h-5 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
          <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  const { campaign } = data;
  const bannerImage = campaign.thumbnailUrl ?? placeholderImage(campaign.id);
  const endDateFormatted = format(new Date(campaign.recruitmentEndAt), "yyyy.MM.dd");
  const startDateFormatted = format(new Date(campaign.recruitmentStartAt), "yyyy.MM.dd");

  const handleApplyClick = () => {
    switch (eligibility.status) {
      case "needs_login":
        router.push(`/login?redirectedFrom=/campaigns/${campaign.id}`);
        return;
      case "not_influencer":
        toast({
          title: "지원 대상이 아닙니다.",
          description: eligibility.message,
          variant: "destructive",
        });
        return;
      case "profile_incomplete":
        toast({
          title: "프로필을 완료해 주세요.",
          description: eligibility.message,
          variant: "destructive",
        });
        router.push("/onboarding/influencer");
        return;
      case "already_applied":
      case "campaign_closed":
        toast({
          title: "지원할 수 없습니다.",
          description: eligibility.message,
          variant: "destructive",
        });
        return;
      case "can_apply":
      default:
        router.push(`/campaigns/${campaign.id}/apply`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200">
          <Image
            src={bannerImage}
            alt={campaign.title}
            width={960}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Badge variant={campaign.status === "recruiting" ? "default" : "secondary"}>
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </Badge>
            <span className="text-xs text-slate-500">모집기간 {startDateFormatted} ~ {endDateFormatted}</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">{campaign.title}</h1>
            <p className="text-sm text-slate-500">
              모집 인원 {campaign.capacity}명 · 매장 위치 {campaign.storeInfo}
            </p>
          </div>
          <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
              모집 마감: {endDateFormatted}
            </p>
            <p className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 text-slate-400" />
              모집 인원: {campaign.capacity}명
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              매장 정보: {campaign.storeInfo}
            </p>
            <p className="flex items-start gap-2">
              <Target className="mt-0.5 h-4 w-4 text-slate-400" />
              미션: {campaign.mission}
            </p>
            <p className="flex items-start gap-2">
              <Gift className="mt-0.5 h-4 w-4 text-slate-400" />
              혜택: {campaign.benefits}
            </p>
          </div>
          <Button
            type="button"
            onClick={handleApplyClick}
            disabled={!eligibility.canApply}
            className="w-full"
          >
            {eligibility.canApply ? "지원하기" : eligibility.message}
          </Button>
        </aside>
      </div>
    </div>
  );
};
