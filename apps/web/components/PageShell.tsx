import type { ReactNode } from "react";

export function PageShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="mb-3 text-4xl font-extrabold tracking-tight">{title}</h1>
      {intro && <p className="mb-10 text-lg text-text-muted">{intro}</p>}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function DraftBanner({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-highlight/40 bg-highlight/10 px-3 py-2 text-sm text-highlight">{children}</p>
  );
}
