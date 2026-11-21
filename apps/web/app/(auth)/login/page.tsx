"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { loginForm } from "@myai/shared-schemas";
import { firebase } from "@/lib/firebase";
import { authErrorMessage } from "@/lib/auth";
import { useRedirectIfSignedIn } from "@/lib/useRedirectIfSignedIn";
import { Button, Field, Notice } from "@/components/ui";
import { Divider, GoogleButton } from "@/components/GoogleButton";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  useRedirectIfSignedIn();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = loginForm.safeParse(data);
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setFieldErrors({});
    setBusy(true);
    try {
      await signInWithEmailAndPassword(firebase().auth, parsed.data.email, parsed.data.password);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
      <p className="mb-6 text-sm text-text-muted">Sign in to continue your conversations.</p>
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      <GoogleButton onError={setError} />
      <Divider />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" name="email" type="email" autoComplete="email" error={fieldErrors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" error={fieldErrors.password} />
        <div className="text-right text-sm">
          <Link href="/forgot-password" className="text-primary-soft hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-muted">
        New to MYai?{" "}
        <Link href="/register" className="font-semibold text-primary-soft hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
