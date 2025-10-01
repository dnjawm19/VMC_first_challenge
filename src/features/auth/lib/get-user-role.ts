import type { CurrentUser } from "@/features/auth/types";

export const getUserRole = (user: CurrentUser | null) => {
  if (!user) {
    return null;
  }

  const metadataRole = (() => {
    const fromApp = user.appMetadata?.role;
    if (typeof fromApp === "string" && fromApp.length > 0) {
      return fromApp;
    }

    const fromUser = user.userMetadata?.role;
    if (typeof fromUser === "string" && fromUser.length > 0) {
      return fromUser;
    }

    return null;
  })();

  return metadataRole;
};
