"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_ONBOARDING_AUTH_METHOD,
  INFLUENCER_CHANNEL_LABELS,
  INFLUENCER_CHANNEL_TYPES,
  ONBOARDING_ROLE_LABELS,
  ONBOARDING_ROLES,
  ONBOARDING_TERMS,
} from "@/features/onboarding/constants";
import { useSignupMutation } from "@/features/onboarding/hooks/useSignupMutation";
import { match } from "ts-pattern";

const isoDateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  .refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }, "유효한 날짜가 아닙니다.");

const SignupBaseSchema = z.object({
  fullName: z.string().min(1, "이름을 입력해 주세요."),
  phone: z
    .string()
    .min(10, "휴대폰 번호를 정확히 입력해 주세요.")
    .max(20, "휴대폰 번호가 너무 깁니다."),
  birthDate: isoDateSchema,
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다."),
  role: z.enum(ONBOARDING_ROLES, {
    errorMap: () => ({ message: "역할을 선택해 주세요." }),
  }),
  authMethod: z.literal(DEFAULT_ONBOARDING_AUTH_METHOD),
});

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("02")) {
    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 5) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)}-${digits.slice(
      2,
      digits.length - 4
    )}-${digits.slice(-4)}`;
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(
    3,
    digits.length - 4
  )}-${digits.slice(-4)}`;
};

const formatBusinessNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
};

const InfluencerChannelFormSchema = z.object({
  type: z.enum(INFLUENCER_CHANNEL_TYPES, {
    errorMap: () => ({ message: "채널 유형을 선택해 주세요." }),
  }),
  name: z.string().min(1, "채널명을 입력해 주세요."),
  url: z.string().url("올바른 URL을 입력해 주세요."),
  followerCount: z.coerce
    .number({ invalid_type_error: "팔로워 수는 숫자여야 합니다." })
    .int("팔로워 수는 정수여야 합니다.")
    .min(0, "팔로워 수는 0 이상이어야 합니다."),
});

const AdvertiserProfileFormSchema = z.object({
  companyName: z.string().min(1, "업체명을 입력해 주세요."),
  address: z.string().min(1, "주소를 입력해 주세요."),
  storePhone: z
    .string()
    .min(9, "업장 전화번호를 정확히 입력해 주세요.")
    .max(20, "업장 전화번호가 너무 깁니다."),
  businessRegistrationNumber: z
    .string()
    .min(10, "사업자등록번호를 정확히 입력해 주세요.")
    .max(20, "사업자등록번호가 너무 깁니다."),
  representativeName: z.string().min(1, "대표자명을 입력해 주세요."),
});

const TermsAgreementSchema = z.record(z.boolean()).superRefine((value, ctx) => {
  const missingRequired = ONBOARDING_TERMS.filter(
    (term) => term.required && !value[term.code]
  );

  if (missingRequired.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "모든 필수 약관에 동의해 주세요.",
    });
  }
});

const SignupFormSchema = SignupBaseSchema.extend({
  confirmPassword: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다."),
  termsAgreement: TermsAgreementSchema,
  influencerChannels: z.array(InfluencerChannelFormSchema).optional(),
  advertiserProfile: AdvertiserProfileFormSchema.partial().optional(),
}).superRefine((values, ctx) => {
  if (values.password !== values.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "비밀번호가 일치하지 않습니다.",
    });
  }

  if (values.role === "influencer") {
    const channels = values.influencerChannels ?? [];

    if (channels.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["influencerChannels"],
        message: "최소 한 개 이상의 채널을 등록해 주세요.",
      });
    }
  }

  if (values.role === "advertiser") {
    const advertiserProfile = values.advertiserProfile;

    const parsed = AdvertiserProfileFormSchema.safeParse(advertiserProfile);

    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["advertiserProfile"],
        message: "광고주 정보를 모두 입력해 주세요.",
      });
    }
  }
});

export type SignupFormValues = z.infer<typeof SignupFormSchema>;

const createDefaultFormValues = (): SignupFormValues => ({
  fullName: "",
  phone: "",
  birthDate: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: ONBOARDING_ROLES[0],
  authMethod: DEFAULT_ONBOARDING_AUTH_METHOD,
  termsAgreement: ONBOARDING_TERMS.reduce<Record<string, boolean>>(
    (accumulator, term) => ({
      ...accumulator,
      [term.code]: false,
    }),
    {}
  ),
  influencerChannels: [],
  advertiserProfile: undefined,
});

export const SignupRoleForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const signupMutation = useSignupMutation();

  const defaultValues = useMemo(createDefaultFormValues, []);

  const form = useForm<SignupFormValues>({
    mode: "onSubmit",
    resolver: zodResolver(SignupFormSchema),
    defaultValues,
  });

  const isSubmitting = signupMutation.isPending || form.formState.isSubmitting;

  const termsList = useMemo(() => ONBOARDING_TERMS, []);
  const role = form.watch("role");
  const advertiserDefaults = useMemo(
    () => ({
      companyName: "",
      address: "",
      storePhone: "",
      businessRegistrationNumber: "",
      representativeName: "",
    }),
    []
  );

  const {
    fields: influencerChannels,
    append: appendChannel,
    remove: removeChannel,
  } = useFieldArray({
    control: form.control,
    name: "influencerChannels",
  });

  const addChannel = useCallback(() => {
    appendChannel({
      type: INFLUENCER_CHANNEL_TYPES[0],
      name: "",
      url: "",
      followerCount: 0,
    });
  }, [appendChannel]);

  useEffect(() => {
    if (role === "influencer") {
      const current = form.getValues("influencerChannels") ?? [];

      if (current.length === 0 && influencerChannels.length === 0) {
        addChannel();
      }

      return;
    }

    if (influencerChannels.length > 0) {
      for (let index = influencerChannels.length - 1; index >= 0; index -= 1) {
        removeChannel(index);
      }
    }

    form.setValue("influencerChannels", []);
  }, [addChannel, form, influencerChannels.length, removeChannel, role]);

  useEffect(() => {
    if (role === "advertiser") {
      const current = form.getValues("advertiserProfile");

      if (!current) {
        form.setValue("advertiserProfile", advertiserDefaults);
      }

      return;
    }

    form.setValue("advertiserProfile", undefined);
  }, [advertiserDefaults, form, role]);

  const onSubmit = useCallback(
    async (values: SignupFormValues) => {
      const agreedTerms = termsList
        .filter((term) => values.termsAgreement[term.code])
        .map((term) => ({ code: term.code, version: term.version }));

      const influencerProfile =
        values.role === "influencer"
          ? {
              channels: (values.influencerChannels ?? []).map((channel) => ({
                type: channel.type,
                name: channel.name,
                url: channel.url,
                followerCount: channel.followerCount ?? 0,
              })),
            }
          : undefined;

      const advertiserProfile =
        values.role === "advertiser" && values.advertiserProfile
          ? {
              companyName: values.advertiserProfile.companyName,
              address: values.advertiserProfile.address,
              storePhone: values.advertiserProfile.storePhone,
              businessRegistrationNumber:
                values.advertiserProfile.businessRegistrationNumber,
              representativeName: values.advertiserProfile.representativeName,
            }
          : undefined;

      try {
        const payload = {
          fullName: values.fullName,
          phone: values.phone,
          birthDate: values.birthDate,
          email: values.email,
          password: values.password,
          role: values.role,
          authMethod: DEFAULT_ONBOARDING_AUTH_METHOD,
          terms: agreedTerms,
          influencerProfile,
          advertiserProfile,
        };

        console.info("[signup] submitting payload", payload);

        const response = await signupMutation.mutateAsync(payload);

        const emailQuery = encodeURIComponent(response.email);
        toast({
          title: "회원가입 완료",
          description:
            "확인 이메일을 발송했습니다. 이메일 인증 후 로그인해 주세요.",
        });
        form.reset(createDefaultFormValues());
        router.push(`/signup/verify?email=${emailQuery}`);
      } catch (error) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : "회원가입에 실패했습니다.";

        if (typeof window !== "undefined") {
          window.alert(message);
        }

        toast({
          title: "회원가입 실패",
          description: message,
          variant: "destructive",
        });
      }
    },
    [form, router, signupMutation, termsList, toast]
  );

  const onInvalid = useCallback(
    (errors: FieldErrors<SignupFormValues>) => {
      const termsError = errors.termsAgreement;

      if (!termsError) {
        return;
      }

      const message =
        typeof termsError === "object" &&
        termsError !== null &&
        "message" in termsError &&
        typeof (termsError as unknown as { message?: unknown }).message ===
          "string"
          ? (termsError as unknown as { message: string }).message
          : "필수 약관에 동의해 주세요.";

      toast({
        title: "약관 동의 필요",
        description: message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const influencerSection = match(role)
    .with("influencer", () => (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              SNS 채널 정보
            </h2>
            <p className="text-sm text-slate-500">
              체험단 매칭을 위해 운영 중인 채널을 등록해 주세요.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addChannel}
            disabled={influencerChannels.length >= 5}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> 채널 추가
          </Button>
        </div>
        <div className="space-y-4">
          {influencerChannels.map((channel, index) => (
            <div
              key={channel.id}
              className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`influencerChannels.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>채널 유형</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="채널 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INFLUENCER_CHANNEL_TYPES.map((type) => (
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
                  name={`influencerChannels.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>채널명</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="채널명을 입력해 주세요."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`influencerChannels.${index}.url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>채널 URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`influencerChannels.${index}.followerCount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>팔로워 수</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const inputValue = event.target.value;
                            field.onChange(
                              inputValue === "" ? undefined : Number(inputValue)
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChannel(index)}
                  disabled={influencerChannels.length <= 1}
                  className="gap-1 text-slate-500"
                >
                  <Trash2 className="h-4 w-4" /> 채널 삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))
    .otherwise(() => null);

  const advertiserSection = match(role)
    .with("advertiser", () => (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">광고주 정보</h2>
          <p className="text-sm text-slate-500">
            체험단 관리를 위해 업체 정보를 입력해 주세요.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="advertiserProfile.companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>업체명</FormLabel>
                <FormControl>
                  <Input placeholder="업체명을 입력해 주세요." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="advertiserProfile.representativeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>대표자명</FormLabel>
                <FormControl>
                  <Input placeholder="대표자명을 입력해 주세요." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="advertiserProfile.storePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>업장 전화번호</FormLabel>
                <FormControl>
                  <Input
                    placeholder="02-000-0000"
                    {...field}
                    onChange={(event) => {
                      field.onChange(formatPhoneNumber(event.target.value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="advertiserProfile.businessRegistrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사업자등록번호</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000-00-00000"
                    {...field}
                    onChange={(event) => {
                      field.onChange(formatBusinessNumber(event.target.value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="advertiserProfile.address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주소</FormLabel>
              <FormControl>
                <Input placeholder="주소를 입력해 주세요." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    ))
    .otherwise(() => null);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="flex flex-col gap-6"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름</FormLabel>
                <FormControl>
                  <Input placeholder="홍길동" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>휴대폰 번호</FormLabel>
                <FormControl>
                  <Input
                    placeholder="010-1234-5678"
                    {...field}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "");

                      if (digits.startsWith("02")) {
                        if (digits.length <= 2) {
                          field.onChange(digits);
                          return;
                        }

                        if (digits.length <= 5) {
                          field.onChange(
                            `${digits.slice(0, 2)}-${digits.slice(2)}`
                          );
                          return;
                        }

                        field.onChange(
                          `${digits.slice(0, 2)}-${digits.slice(
                            2,
                            digits.length - 4
                          )}-${digits.slice(-4)}`
                        );
                        return;
                      }

                      if (digits.length <= 3) {
                        field.onChange(digits);
                        return;
                      }

                      if (digits.length <= 7) {
                        field.onChange(
                          `${digits.slice(0, 3)}-${digits.slice(3)}`
                        );
                        return;
                      }

                      field.onChange(
                        `${digits.slice(0, 3)}-${digits.slice(
                          3,
                          digits.length - 4
                        )}-${digits.slice(-4)}`
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>생년월일</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>역할 선택</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="역할을 선택해 주세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ONBOARDING_ROLES.map((candidate) => (
                      <SelectItem key={candidate} value={candidate}>
                        {ONBOARDING_ROLE_LABELS[candidate]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 확인</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {influencerSection}
        {advertiserSection}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">약관 동의</h2>
          <div className="space-y-3">
            {termsList.map((term) => (
              <FormField
                key={term.code}
                control={form.control}
                name={`termsAgreement.${term.code}`}
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id={`terms-${term.code}`}
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel
                        htmlFor={`terms-${term.code}`}
                        className="font-medium"
                      >
                        {term.title}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
          {form.formState.errors.termsAgreement ? (
            <p className="text-sm text-rose-600">필수 약관에 동의해 주세요.</p>
          ) : null}
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "회원가입 처리 중..." : "회원가입"}
        </Button>
      </form>
    </Form>
  );
};
