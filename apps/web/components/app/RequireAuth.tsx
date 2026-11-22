"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { hasCurrentConsents, recordConsents } from "@/lib/consent";
import { Button, Notice, Spinner } from "@/components/ui";
import { Wordmark } from "@/components/Wordmark";

/** Client-side gate for the signed-in area; no server session cookies in version 1 (PLAN section 7). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, profile, bootstrapError, retry, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [user, router, pathname]);

  if (!user) return <Spinner label="Checking your session" />;
  if (bootstrapError)
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
        <Notice tone="error">{bootstrapError}</Notice>
        <div className="flex gap-2">
          <Button onClick={retry}>Try again</Button>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  if (!profile) return <Spinner label="Setting up your account" />;
  return <ConsentGate uid={user.uid}>{children}</ConsentGate>;
}

/**
 * Google sign-ups skip the register form, so the terms, privacy and AI data consent
 * are asked here before the first chat (PLAN section 12, step 3; Apple 5.1.2(i)).
 */
function ConsentGate({ uid, children }: { uid: string; children: ReactNode }) {
  const [state, setState] = useState<"checking" | "needed" | "ok">("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    hasCurrentConsents(uid)
      .then((ok) => live && setState(ok ? "ok" : "needed"))
      .catch(() => live && setState("needed"));
    return () => {
      live = false;
    };
  }, [uid]);

  if (state === "checking") return <Spinner />;
  if (state === "ok") return <>{children}</>;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface/90 p-8 glow">
        <div className="mb-6">
          <Wordmark />
        </div>
        <h1 className="mb-3 text-2xl font-bold">Before you start</h1>
        <ul className="mb-6 list-disc space-y-2 pl-5 text-sm text-text-muted">
          <li>
            You accept the <a className="text-primary-soft underline" href="/terms" target="_blank">terms of use</a> and
            the <a className="text-primary-soft underline" href="/privacy" target="_blank">privacy notice</a>.
          </li>
          <li>Your messages and files are sent to MYai&apos;s AI provider, outside Malaysia, to generate replies.</li>
          <li>AI answers can be wrong. Check anything important.</li>
        </ul>
        {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
        <Button
          className="w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await recordConsents(uid);
              setState("ok");
            } catch {
              setError("Could not save your choice. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          I agree, continue
        </Button>
      </div>
    </div>
  );
}
