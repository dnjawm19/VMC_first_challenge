"use client";

import { useEffect, useState } from "react";
import { CampaignDetailSection } from "@/features/campaigns/components/campaign-detail-section";

type CampaignDetailPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const [campaignId, setCampaignId] = useState<string | null>(null);

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

  if (!campaignId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <CampaignDetailSection campaignId={campaignId} />
    </div>
  );
}
