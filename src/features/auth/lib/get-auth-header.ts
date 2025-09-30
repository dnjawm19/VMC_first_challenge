import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type AuthHeaderResult = {
  Authorization: string;
};

export const getAuthHeader = async (): Promise<AuthHeaderResult> => {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error("세션 정보를 불러오지 못했습니다.");
  }

  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error("인증이 필요합니다. 다시 로그인해 주세요.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  } satisfies AuthHeaderResult;
};
