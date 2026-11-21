"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import type { Plan, UsageRecord } from "@myai/shared-types";
import { firebase } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Card, Notice, Spinner } from "@/components/ui";

const rows: { key: keyof Plan["dailyLimits"] & keyof UsageRecord; label: string }[] = [
  { key: "chats", label: "Chats" },
  { key: "drafts", label: "Writing drafts" },
  { key: "lessons", label: "Lessons" },
  { key: "workRuns", label: "Work runs" },
];

function todayKey() {
  // Malaysia time (UTC+8) so the day resets at local midnight.
  const d = new Date(Date.now() + 8 * 3600_000);
  return d.toISOString().slice(0, 10).replaceAll("-", "");
}

/** Reads directly for now; switches to the getUsage function when it exists (PLAN section 14). */
export default function UsagePage() {
  const { user, profile } = useAuth();
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [usage, setUsage] = useState<UsageRecord | null>(null);

  useEffect(() => {
    if (!user || !profile) return;
    const { db } = firebase();
    getDoc(doc(db, "plans", profile.planId))
      .then((s) => setPlan(s.exists() ? (s.data() as Plan) : null))
      .catch(() => setPlan(null));
    // A missing record is refused by the rules (resource is null), which simply means no usage today.
    getDoc(doc(db, "usage_records", `${user.uid}_${todayKey()}`))
      .then((s) => setUsage(s.exists() ? (s.data() as UsageRecord) : null))
      .catch(() => setUsage(null));
  }, [user, profile]);

  if (plan === undefined) return <Spinner label="Loading usage" />;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Usage today</h1>
      {!plan ? (
        <Notice>Plan limits are not set up yet.</Notice>
      ) : (
        <Card className="space-y-5">
          <p className="text-sm text-text-muted">
            Plan: <span className="font-semibold text-text">{plan.name}</span> · resets at midnight Malaysia time
          </p>
          {rows.map(({ key, label }) => {
            const used = usage?.[key] ?? 0;
            const max = plan.dailyLimits[key];
            const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
            return (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-text-muted">{used} / {max}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-raised" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
                  <div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
