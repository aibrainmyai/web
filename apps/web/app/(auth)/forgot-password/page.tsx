"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { emailSchema } from "@myai/shared-schemas";
import { firebase } from "@/lib/firebase";
import { Button, Field, Notice } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await sendPasswordResetEmail(firebase().auth, parsed.data);
    } catch {
      // Same message whether or not the account exists, so emails cannot be enumerated.
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Reset your password</h1>
      <p className="mb-6 text-sm text-text-muted">We will email you a link to choose a new one.</p>
      {sent ? (
        <Notice tone="success">If an account exists for that email, a reset link is on its way.</Notice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" name="email" type="email" autoComplete="email" error={error} />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-text-muted">
        <Link href="/login" className="font-semibold text-primary-soft hover:underline">Back to sign in</Link>
      </p>
    </>
  );
}
