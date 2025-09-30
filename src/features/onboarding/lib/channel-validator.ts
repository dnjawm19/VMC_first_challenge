import { INFLUENCER_CHANNEL_TYPES } from "@/features/onboarding/constants";

export type NormalizedChannel = {
  type: (typeof INFLUENCER_CHANNEL_TYPES)[number];
  url: string;
};

type ChannelValidationResult =
  | { ok: true; value: NormalizedChannel }
  | { ok: false; reason: string };

const ensureProtocol = (rawUrl: string) => {
  const trimmed = rawUrl.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const validateHost = (host: string, allowedHosts: string[]) =>
  allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));

const normalizeUrl = (type: (typeof INFLUENCER_CHANNEL_TYPES)[number], rawUrl: string) => {
  const urlWithProtocol = ensureProtocol(rawUrl);

  try {
    const parsed = new URL(urlWithProtocol);

    switch (type) {
      case "naver": {
        if (!validateHost(parsed.hostname, ["naver.com", "naver.me"])) {
          return {
            ok: false,
            reason: "네이버 채널 URL을 확인해 주세요.",
          } as ChannelValidationResult;
        }
        break;
      }
      case "youtube": {
        if (
          !validateHost(parsed.hostname, ["youtube.com", "youtu.be"]) &&
          !parsed.hostname.endsWith(".youtube.com")
        ) {
          return {
            ok: false,
            reason: "유튜브 주소만 입력할 수 있습니다.",
          } as ChannelValidationResult;
        }
        break;
      }
      case "instagram": {
        if (!validateHost(parsed.hostname, ["instagram.com"])) {
          return {
            ok: false,
            reason: "인스타그램 주소만 입력할 수 있습니다.",
          } as ChannelValidationResult;
        }
        break;
      }
      case "threads": {
        if (!validateHost(parsed.hostname, ["threads.net"])) {
          return {
            ok: false,
            reason: "Threads 주소만 입력할 수 있습니다.",
          } as ChannelValidationResult;
        }
        break;
      }
      default: {
        return {
          ok: false,
          reason: "지원하지 않는 채널 유형입니다.",
        } as ChannelValidationResult;
      }
    }

    const normalizedPath = parsed.pathname.replace(/\/$/, "");

    if (!normalizedPath || normalizedPath === "") {
      return {
        ok: false,
        reason: "채널 경로가 비어 있습니다.",
      } as ChannelValidationResult;
    }

    parsed.pathname = normalizedPath;

    return {
      ok: true,
      value: {
        type,
        url: parsed.toString(),
      },
    } satisfies ChannelValidationResult;
  } catch (error) {
    return {
      ok: false,
      reason: "유효한 URL 형식이 아닙니다.",
    } satisfies ChannelValidationResult;
  }
};

export const validateAndNormalizeChannel = (
  type: (typeof INFLUENCER_CHANNEL_TYPES)[number],
  rawUrl: string
): ChannelValidationResult => normalizeUrl(type, rawUrl);
