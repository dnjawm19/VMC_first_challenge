"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import {
  CampaignCreateRequestSchema,
  type CampaignCreateRequest,
} from "@/features/campaign-management/backend/schema";

export const CampaignFormSchema = CampaignCreateRequestSchema;
export type CampaignFormValues = CampaignCreateRequest;

export const createCampaignDefaultValues = (): CampaignFormValues => ({
  title: "",
  recruitmentStartAt: new Date().toISOString().slice(0, 10),
  recruitmentEndAt: new Date().toISOString().slice(0, 10),
  capacity: 10,
  benefits: "",
  mission: "",
  storeInfo: "",
  thumbnailUrl: undefined,
});

export const useCampaignForm = (defaultValues: CampaignFormValues) => {
  const form = useForm<CampaignFormValues>({
    mode: "onSubmit",
    resolver: zodResolver(CampaignFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return form;
};

export type CampaignFormProps = {
  form: UseFormReturn<CampaignFormValues>;
  submitLabel: string;
  onSubmit: (values: CampaignFormValues) => void | Promise<void>;
  isSubmitting: boolean;
};

export const CampaignForm = ({ form, submitLabel, onSubmit, isSubmitting }: CampaignFormProps) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                value={field.value ?? ""}
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
              <Textarea rows={3} placeholder="예) SNS 후기 작성, 리뷰 게시" {...field} />
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
              <Textarea rows={3} placeholder="매장 주소 및 이용 안내를 입력해 주세요." {...field} />
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
            <FormLabel>썸네일 이미지 URL (선택)</FormLabel>
            <FormControl>
              <Input placeholder="https://" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? `${submitLabel} 중` : submitLabel}
        </Button>
      </div>
    </form>
  </Form>
);
