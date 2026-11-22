"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { registerForm } from "@myai/shared-schemas";
import { firebase } from "@/lib/firebase";
import { authErrorMessage, holdAccountSetup } from "@/lib/auth";
import { recordConsents } from "@/lib/consent";
import { useRedirectIfSignedIn } from "@/lib/useRedirectIfSignedIn";
import { Button, Field, Notice } from "@/components/ui";
import { Divider, GoogleButton } from "@/components/GoogleButton";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  useRedirectIfSignedIn();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const parsed = registerForm.safeParse({
      displayName: fd.get("displayName"),
      email: fd.get("email"),
      password: fd.get("password"),
      acceptTerms: fd.get("acceptTerms") === "on",
    });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setFieldErrors({});
    setBusy(true);
    const releaseSetup = holdAccountSetup();
    try {
      const { auth } = firebase();
      const cred = await createUserWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      await updateProfile(cred.user, { displayName: parsed.data.displayName });
      await recordConsents(cred.user.uid);
      await sendEmailVerification(cred.user).catch(() => {});
      // useRedirectIfSignedIn moves the user on once the auth state updates.
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      releaseSetup();
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
      <p className="mb-6 text-sm text-text-muted">Free to start. One account for web and mobile.</p>
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      <GoogleButton onError={setError} />
      <Divider />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Name" name="displayName" autoComplete="name" error={fieldErrors.displayName} />
        <Field label="Email" name="email" type="email" autoComplete="email" error={fieldErrors.email} />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          error={fieldErrors.password}
        />
        <div>
          <label className="flex items-start gap-2 text-sm text-text-muted">
            <input type="checkbox" name="acceptTerms" className="mt-1 accent-primary" />
            <span>
              I accept the{" "}
              <Link href="/terms" target="_blank" className="text-primary-soft hover:underline">terms</Link>
              {" "}and{" "}
              <Link href="/privacy" target="_blank" className="text-primary-soft hover:underline">privacy notice</Link>,
              and agree that my messages and files are processed by MYai&apos;s AI provider outside Malaysia.
            </span>
          </label>
          {fieldErrors.acceptTerms && <p className="mt-1 text-xs text-danger">{fieldErrors.acceptTerms}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary-soft hover:underline">Sign in</Link>
      </p>
    </>
  );
}
