"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  AdvertiserProfileUpsertRequestSchema,
  type AdvertiserProfileUpsertRequest,
} from "@/features/onboarding/backend/schema";
import { onboardingErrorCodes } from "@/features/onboarding/backend/error";
import { useAdvertiserProfileQuery } from "@/features/onboarding/hooks/useAdvertiserProfileQuery";
import { useUpsertAdvertiserProfileMutation } from "@/features/onboarding/hooks/useUpsertAdvertiserProfileMutation";

const AdvertiserFormSchema = AdvertiserProfileUpsertRequestSchema;

type AdvertiserFormValues = z.infer<typeof AdvertiserFormSchema>;

const createDefaultValues = (): AdvertiserFormValues => ({
  companyName: "",
  address: "",
  storePhone: "",
  businessRegistrationNumber: "",
  representativeName: "",
});

const formatBusinessNumber = (value: string) =>
  value.replace(/[^0-9]/g, "").replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");

const formatPhoneNumber = (value: string) => {
  const digitsOnly = value.replace(/[^0-9]/g, "");

  if (digitsOnly.length <= 3) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 7) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
  }

  return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7, 11)}`;
};

export const AdvertiserProfileForm = () => {
  const { toast } = useToast();
  const profileQuery = useAdvertiserProfileQuery();
  const mutation = useUpsertAdvertiserProfileMutation();

  const form = useForm<AdvertiserFormValues>({
    mode: "onSubmit",
    resolver: zodResolver(AdvertiserFormSchema),
    defaultValues: createDefaultValues(),
  });

  useEffect(() => {
    if (profileQuery.isError && profileQuery.error) {
      toast({
        title: "불러오기 실패",
        description: profileQuery.error.message,
        variant: "destructive",
      });
    }
  }, [profileQuery.error, profileQuery.isError, toast]);

  useEffect(() => {
    const profile = profileQuery.data?.profile;

    if (!profile) {
      form.reset(createDefaultValues());
      return;
    }

    form.reset({
      companyName: profile.companyName,
      address: profile.address,
      storePhone: profile.storePhone,
      businessRegistrationNumber: profile.businessRegistrationNumber,
      representativeName: profile.representativeName,
    });
  }, [form, profileQuery.data]);

  const verificationStatus =
    profileQuery.data?.profile?.verificationStatus ?? "pending";

  const onSubmit = async (values: AdvertiserFormValues) => {
    form.clearErrors();

    mutation.mutate(
      {
        ...values,
        storePhone: values.storePhone.replace(/[^0-9]/g, ""),
        businessRegistrationNumber: values.businessRegistrationNumber.replace(
          /[^0-9]/g,
          ""
        ),
      },
      {
        onSuccess: () => {
          toast({
            title: "저장 완료",
            description: "광고주 정보를 저장했습니다.",
          });
        },
        onError: (error) => {
          if (
            error.code ===
              onboardingErrorCodes.advertiserBusinessNumberInvalid ||
            error.code ===
              onboardingErrorCodes.advertiserBusinessNumberDuplicate ||
            error.code === onboardingErrorCodes.validationError
          ) {
            form.setError("businessRegistrationNumber", {
              type: "server",
              message: error.message,
            });
          }

          toast({
            title: "저장 실패",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (profileQuery.isLoading && !profileQuery.data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        광고주 정보를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">광고주 정보</h2>
        <p className="text-sm text-slate-500">
          업체 정보를 등록하면 체험단을 생성하고 관리할 수 있습니다.
        </p>
      </div>
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>업체명</FormLabel>
                    <FormControl>
                      <Input placeholder="OOO 매장" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주소</FormLabel>
                    <FormControl>
                      <Input placeholder="서울시 강남구 ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="storePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>업장 전화번호</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="tel"
                        placeholder="02-1234-5678"
                        value={formatPhoneNumber(field.value ?? "")}
                        onChange={(event) =>
                          field.onChange(event.target.value.replace(/[^0-9]/g, ""))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="representativeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>대표자명</FormLabel>
                    <FormControl>
                      <Input placeholder="대표자 이름" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="businessRegistrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사업자등록번호</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="000-00-00000"
                      value={formatBusinessNumber(field.value ?? "")}
                      onChange={(event) => {
                        const digitsOnly = event.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 10);
                        field.onChange(digitsOnly);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    숫자만 입력해 주세요. 저장 시 자동으로 검증합니다.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 shadow-sm">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5 text-slate-500" />
              <div className="space-y-2">
                <p className="font-medium text-slate-700">검증 상태</p>
                <p>
                  {verificationStatus === "verified"
                    ? "사업자 정보가 검증되었습니다."
                    : verificationStatus === "rejected"
                    ? "사업자 정보 검증이 반려되었습니다. 지원팀에 문의해 주세요."
                    : "검증이 진행 중입니다. 처리 완료 시 알림을 드립니다."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "저장 중" : "저장하기"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
