"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./auth";

/** Only same-site paths are allowed as a redirect target, so ?next= cannot send people to another site. */
export function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/chat";
}

/** On the sign-in pages: once the account is ready, move on to ?next= or the chat. */
export function useRedirectIfSignedIn() {
  const { user, profile, bootstrapError } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  useEffect(() => {
    if (user && (profile || bootstrapError)) router.replace(next);
  }, [user, profile, bootstrapError, router, next]);
}
