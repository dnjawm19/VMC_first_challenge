"use client";

import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  INFLUENCER_CHANNEL_LABELS,
  INFLUENCER_CHANNEL_TYPES,
  type InfluencerChannelType,
} from "@/features/onboarding/constants";
import {
  InfluencerProfileUpsertRequestSchema,
  type InfluencerProfileUpsertRequest,
} from "@/features/onboarding/backend/schema";
import { useInfluencerProfileQuery } from "@/features/onboarding/hooks/useInfluencerProfileQuery";
import { useUpsertInfluencerProfileMutation } from "@/features/onboarding/hooks/useUpsertInfluencerProfileMutation";

const InfluencerFormSchema = InfluencerProfileUpsertRequestSchema;

type InfluencerFormValues = z.infer<typeof InfluencerFormSchema>;

const createDefaultChannel = (): InfluencerFormValues["channels"][number] => ({
  type: INFLUENCER_CHANNEL_TYPES[0],
  name: "",
  url: "",
  followerCount: 0,
});

const createDefaultValues = (): InfluencerFormValues => ({
  birthDate: "",
  channels: [createDefaultChannel()],
});

export const InfluencerProfileForm = () => {
  const { toast } = useToast();
  const profileQuery = useInfluencerProfileQuery();
  const mutation = useUpsertInfluencerProfileMutation();

  const form = useForm<InfluencerFormValues>({
    mode: "onSubmit",
    resolver: zodResolver(InfluencerFormSchema),
    defaultValues: createDefaultValues(),
  });

  const {
    fields: channelFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "channels",
  });

  const isSubmitting = mutation.isPending || form.formState.isSubmitting;

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    form.reset({
      birthDate: profileQuery.data.profile?.birthDate ?? "",
      channels:
        profileQuery.data.channels.length > 0
          ? profileQuery.data.channels.map((channel) => ({
              type: channel.type,
              name: channel.name,
              url: channel.url,
              followerCount: channel.followerCount ?? 0,
            }))
          : [createDefaultChannel()],
    });
  }, [form, profileQuery.data]);

  const addChannel = () => {
    append(createDefaultChannel());
  };

  const onSubmit = async (values: InfluencerFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "저장 완료",
          description: "인플루언서 정보를 저장했습니다.",
        });
      },
      onError: (error) => {
        toast({
          title: "저장 실패",
          description: error.message,
        });
      },
    });
  };

  const channelTypeOptions = useMemo(() => INFLUENCER_CHANNEL_TYPES, []);

  if (profileQuery.isLoading && !profileQuery.data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        인플루언서 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600 shadow-sm">
        {profileQuery.error.message ?? "인플루언서 정보를 불러오지 못했습니다."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">인플루언서 정보</h2>
        <p className="text-sm text-slate-500">
          생년월일과 SNS 채널을 등록하면 체험단 지원이 가능해집니다.
        </p>
      </div>
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>생년월일</FormLabel>
                    <FormControl>
                      <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                    </FormControl>
                    <FormDescription>
                      만 14세 이상만 체험단 지원이 가능합니다.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">SNS 채널</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChannel}
                disabled={channelFields.length >= 5}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> 채널 추가
              </Button>
            </div>
            <div className="space-y-4">
              {channelFields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <FormField
                      control={form.control}
                      name={`channels.${index}.type`}
                      render={({ field: typeField }) => (
                        <FormItem className="w-full lg:max-w-[200px]">
                          <FormLabel>채널 유형</FormLabel>
                          <Select
                            value={typeField.value}
                            onValueChange={typeField.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="채널 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {channelTypeOptions.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {INFLUENCER_CHANNEL_LABELS[type]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`channels.${index}.name`}
                      render={({ field: nameField }) => (
                        <FormItem className="flex-1">
                          <FormLabel>채널명</FormLabel>
                          <FormControl>
                            <Input placeholder="채널 이름" {...nameField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`channels.${index}.url`}
                      render={({ field: urlField }) => (
                        <FormItem className="flex-1">
                          <FormLabel>채널 URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://"
                              inputMode="url"
                              {...urlField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`channels.${index}.followerCount`}
                      render={({ field: followerField }) => (
                        <FormItem className="w-full lg:max-w-[180px]">
                          <FormLabel>팔로워 수</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              value={String(followerField.value ?? 0)}
                              onChange={(event) =>
                                followerField.onChange(
                                  Number(event.target.value ?? 0)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={channelFields.length === 1}
                        className="text-slate-500 hover:text-rose-500"
                        aria-label="채널 삭제"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중" : "저장하기"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
