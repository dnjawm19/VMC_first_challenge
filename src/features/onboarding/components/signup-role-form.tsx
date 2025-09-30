"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  ONBOARDING_ROLE_LABELS,
  ONBOARDING_ROLES,
  ONBOARDING_TERMS,
} from "@/features/onboarding/constants";
import { SignupRequestSchema } from "@/features/onboarding/backend/schema";
import { useSignupMutation } from "@/features/onboarding/hooks/useSignupMutation";

const SignupBaseSchema = SignupRequestSchema.omit({ terms: true });

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
}).superRefine((values, ctx) => {
  if (values.password !== values.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "비밀번호가 일치하지 않습니다.",
    });
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
});

export const SignupRoleForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const mutation = useSignupMutation();

  const defaultValues = useMemo(createDefaultFormValues, []);

  const form = useForm<SignupFormValues>({
    mode: "onSubmit",
    resolver: zodResolver(SignupFormSchema),
    defaultValues,
  });

  const isSubmitting = mutation.isPending || form.formState.isSubmitting;

  const termsList = useMemo(() => ONBOARDING_TERMS, []);

  const onSubmit = useCallback(
    async (values: SignupFormValues) => {
      const agreedTerms = termsList
        .filter((term) => values.termsAgreement[term.code])
        .map((term) => ({ code: term.code, version: term.version }));

      mutation.mutate(
        {
          fullName: values.fullName,
          phone: values.phone,
          birthDate: values.birthDate,
          email: values.email,
          password: values.password,
          role: values.role,
          authMethod: values.authMethod,
          terms: agreedTerms,
        },
        {
          onSuccess: (data) => {
            const emailQuery = encodeURIComponent(data.email);
            toast({
              title: "회원가입 완료",
              description:
                "확인 이메일을 발송했습니다. 이메일 인증 후 로그인해 주세요.",
            });
            form.reset(createDefaultFormValues());
            router.push(`/signup/verify?email=${emailQuery}`);
          },
          onError: (error) => {
            toast({
              title: "회원가입 실패",
              description: error.message,
            });
          },
        }
      );
    },
    [form, mutation, router, termsList, toast]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
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
                  <Input placeholder="010-1234-5678" {...field} />
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
                    {ONBOARDING_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ONBOARDING_ROLE_LABELS[role]}
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
                    placeholder="8자 이상 영문, 숫자"
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
                    placeholder="비밀번호를 다시 입력해 주세요"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="termsAgreement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>약관 동의</FormLabel>
                <div className="space-y-2">
                  {termsList.map((term) => (
                    <div
                      key={term.code}
                      className="flex items-start gap-3 rounded-md border border-slate-200 p-3"
                    >
                      <Checkbox
                        id={term.code}
                        checked={field.value?.[term.code] ?? false}
                        onCheckedChange={(checked) => {
                          field.onChange({
                            ...field.value,
                            [term.code]: Boolean(checked),
                          });
                        }}
                      />
                      <label
                        htmlFor={term.code}
                        className="flex-1 text-sm leading-6 text-slate-700"
                      >
                        {term.title}
                      </label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting ? "가입 처리 중" : "회원가입"}
        </Button>
      </form>
    </Form>
  );
};
