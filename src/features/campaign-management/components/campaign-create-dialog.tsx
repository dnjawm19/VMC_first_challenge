"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CampaignCreateRequestSchema,
  type CampaignCreateRequest,
} from "@/features/campaign-management/backend/schema";
import { useCreateCampaignMutation } from "@/features/campaign-management/hooks/useCreateCampaignMutation";

const CampaignCreateFormSchema = CampaignCreateRequestSchema;

type CampaignCreateFormValues = z.infer<typeof CampaignCreateFormSchema>;

const createDefaultValues = (): CampaignCreateFormValues => ({
  title: "",
  recruitmentStartAt: new Date().toISOString().slice(0, 10),
  recruitmentEndAt: new Date().toISOString().slice(0, 10),
  capacity: 10,
  benefits: "",
  mission: "",
  storeInfo: "",
  thumbnailUrl: undefined,
});

type CampaignCreateDialogProps = {
  disabled?: boolean;
};

export const CampaignCreateDialog = ({ disabled = false }: CampaignCreateDialogProps) => {
  const { toast } = useToast();
  const mutation = useCreateCampaignMutation();
  const [open, setOpen] = useState(false);

  const form = useForm<CampaignCreateFormValues>({
    mode: "onSubmit",
    resolver: zodResolver(CampaignCreateFormSchema),
    defaultValues: createDefaultValues(),
  });

  const isSubmitting = mutation.isPending || form.formState.isSubmitting;

  const handleOpenChange = (next: boolean) => {
    if (disabled) {
      return;
    }

    if (!isSubmitting) {
      setOpen(next);
    }
  };

  const onSubmit = (values: CampaignCreateFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "체험단 등록 완료",
          description: "새로운 체험단을 성공적으로 등록했습니다.",
        });
        form.reset(createDefaultValues());
        setOpen(false);
      },
      onError: (error) => {
        toast({
          title: "체험단 등록 실패",
          description: error.message,
          variant: "destructive",
        });

        if (error.code === "CAMPAIGN_VALIDATION_ERROR") {
          form.setError("title", {
            type: "server",
            message: error.message,
          });
        }
      },
    });
  };

  return (
    <Sheet open={!disabled && open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button type="button" disabled={disabled}>
          신규 체험단 등록
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>체험단 등록</SheetTitle>
          <SheetDescription>
            모집 기간, 혜택, 미션을 입력하고 체험단을 등록하세요.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>체험단명</FormLabel>
                  <FormControl>
                    <Input placeholder="예) 신메뉴 시식 체험단" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="recruitmentStartAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모집 시작일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recruitmentEndAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모집 종료일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모집 인원</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={field.value ?? ''}
                      onChange={(event) => {
                        const inputValue = event.target.value;
                        field.onChange(inputValue ? Number(inputValue) : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="benefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제공 혜택</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="예) 식사 2인 제공, 추가 쿠폰 제공" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>미션</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="예) 방문 후 블로그 리뷰 작성" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storeInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>매장 정보</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="예) 서울시 강남구 테헤란로 ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>썸네일 이미지 (선택)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "등록 중" : "등록하기"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
