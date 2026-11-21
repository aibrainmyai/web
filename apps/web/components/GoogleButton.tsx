"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { firebase } from "@/lib/firebase";
import { authErrorMessage } from "@/lib/auth";
import { Button } from "./ui";

export function GoogleButton({ onError }: { onError: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        onError("");
        try {
          await signInWithPopup(firebase().auth, new GoogleAuthProvider());
          // Redirect happens in the page once the auth state changes.
        } catch (err) {
          onError(authErrorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
      </svg>
      Continue with Google
    </Button>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
