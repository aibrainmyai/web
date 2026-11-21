"use client";

import { useAuth } from "@/lib/auth";
import { Composer } from "@/components/app/Composer";

const starters = [
  { mode: "Write", title: "Write something", prompt: "Draft a polite email asking for a meeting next week." },
  { mode: "Work", title: "Solve a problem", prompt: "Help me plan a monthly budget on RM3,500." },
  { mode: "Create", title: "Create", prompt: "Give me five names for a nasi lemak stall." },
  { mode: "Learn", title: "Learn", prompt: "Explain photosynthesis simply, in Bahasa Melayu." },
];

export default function NewChatPage() {
  const { profile } = useAuth();
  const first = profile?.displayName?.split(" ")[0];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">
        <h1 className="mb-2 text-3xl font-extrabold sm:text-4xl">
          {first ? <>Hi {first}, </> : null}
          <span className="text-brand-gradient">what shall we do today?</span>
        </h1>
        <p className="mb-8 text-text-muted">Pick a starting point or type your own message.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {starters.map((s) => (
            <div key={s.title} className="rounded-lg border border-border bg-surface/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-soft">{s.mode}</p>
              <p className="font-bold">{s.title}</p>
              <p className="mt-1 text-sm text-text-muted">{s.prompt}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="sticky bottom-0">
        <Composer />
      </div>
    </div>
  );
}
