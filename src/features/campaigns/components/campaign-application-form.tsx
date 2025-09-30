"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  CampaignApplicationRequestSchema,
  type CampaignApplicationRequest,
} from "@/features/campaigns/backend/schema";
import { useCampaignApplicationMutation } from "@/features/campaigns/hooks/useCampaignApplicationMutation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ApplicationFormSchema = CampaignApplicationRequestSchema;

export type CampaignApplicationFormValues = z.infer<typeof ApplicationFormSchema>;

const createDefaultValues = (): CampaignApplicationFormValues => ({
  motivation: "",
  visitPlanDate: "",
});

export type CampaignApplicationFormProps = {
  campaignId: string;
};

export const CampaignApplicationForm = ({ campaignId }: CampaignApplicationFormProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const mutation = useCampaignApplicationMutation(campaignId);

  const form = useForm<CampaignApplicationFormValues>({
    mode: "onSubmit",
    resolver: zodResolver(ApplicationFormSchema),
    defaultValues: createDefaultValues(),
  });

  const isSubmitting = mutation.isPending || form.formState.isSubmitting;

  const onSubmit = async (values: CampaignApplicationFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "지원 완료",
          description: "체험단 지원이 정상적으로 접수되었습니다.",
        });
        router.replace("/applications");
      },
      onError: (error) => {
        toast({
          title: "지원 실패",
          description: error.message,
          variant: "destructive",
        });

        if (error.code === "CAMPAIGN_VALIDATION_ERROR") {
          form.setError("motivation", {
            type: "server",
            message: error.message,
          });
          form.setError("visitPlanDate", {
            type: "server",
            message: error.message,
          });
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">체험단 지원하기</h2>
          <p className="text-sm text-slate-500">
            아래 정보를 입력하면 체험단 담당자가 신청서를 검토합니다.
          </p>
        </div>
        <FormField
          control={form.control}
          name="motivation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>각오 한마디</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="체험단에 참여하고 싶은 이유와 각오를 작성해 주세요."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="visitPlanDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>방문 예정일</FormLabel>
              <FormControl>
                <Input type="date" min={new Date().toISOString().slice(0, 10)} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "지원 접수 중" : "지원서 제출"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
