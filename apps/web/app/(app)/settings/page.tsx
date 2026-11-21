"use client";

import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { LANGUAGES, type LanguageCode } from "@myai/shared-types";
import type { ProfileUpdate } from "@myai/shared-schemas";
import { firebase } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Button, Card, Notice, Spinner } from "@/components/ui";

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const [error, setError] = useState("");

  if (!user || !profile) return <Spinner label="Loading settings" />;

  async function save(data: ProfileUpdate) {
    if (!user) return;
    setError("");
    try {
      await updateDoc(doc(firebase().db, "users", user.uid), { ...data, updatedAt: serverTimestamp() });
    } catch {
      setError("Could not save that setting. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Settings</h1>
      {error && <Notice tone="error">{error}</Notice>}

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">Language</h2>
        <p className="text-sm text-text-muted">MYai replies in this language unless you write in another one.</p>
        <label htmlFor="language" className="sr-only">Language</label>
        <select
          id="language"
          value={profile.language}
          onChange={(e) => save({ language: e.target.value as LanguageCode })}
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm"
        >
          {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
            <option key={code} value={code}>{LANGUAGES[code]}</option>
          ))}
        </select>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">Privacy</h2>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 accent-primary"
            checked={profile.memoryEnabled}
            onChange={(e) => save({ memoryEnabled: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-semibold">Let MYai remember facts about me</span>
            <span className="block text-sm text-text-muted">
              Off by default. You will be able to see and delete everything it remembers.
            </span>
          </span>
        </label>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">Account</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={signOut}>Sign out</Button>
          {/* These need the account functions (revoke tokens, delete subtree + Storage + auth user). */}
          <Button variant="outline" disabled title="Coming soon">Sign out of all devices</Button>
          <Button variant="danger" disabled title="Coming soon">Delete account</Button>
        </div>
        <p className="text-xs text-text-muted">Signing out everywhere and account deletion are coming soon.</p>
      </Card>
    </div>
  );
}
