"use client";

import { useState, type FormEvent } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";
import { profileUpdate } from "@myai/shared-schemas";
import { firebase } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Button, Card, Field, Notice, Spinner } from "@/components/ui";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user || !profile) return <Spinner label="Loading profile" />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const parsed = profileUpdate.safeParse({ displayName: new FormData(e.currentTarget).get("displayName") });
    if (!parsed.success) {
      setMsg({ tone: "error", text: "Enter a name between 1 and 60 characters." });
      return;
    }
    setBusy(true);
    try {
      await updateDoc(doc(firebase().db, "users", user.uid), { ...parsed.data, updatedAt: serverTimestamp() });
      setMsg({ tone: "success", text: "Profile saved." });
    } catch {
      setMsg({ tone: "error", text: "Could not save your profile." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Profile</h1>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" name="displayName" defaultValue={profile.displayName} maxLength={60} />
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-text-muted">{user.email}</p>
            {!user.emailVerified && (
              <p className="text-xs text-highlight">
                Not verified yet.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    sendEmailVerification(user)
                      .then(() => setMsg({ tone: "success", text: "Verification email sent." }))
                      .catch(() => setMsg({ tone: "error", text: "Could not send the email. Try again later." }))
                  }
                >
                  Resend verification email
                </button>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Plan</p>
            <p className="text-sm capitalize text-text-muted">{profile.planId}</p>
          </div>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </form>
      </Card>
    </div>
  );
}
