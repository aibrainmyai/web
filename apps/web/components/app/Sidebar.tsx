"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useConversations } from "@/lib/conversations";
import { Wordmark } from "@/components/Wordmark";
import { ButtonLink } from "@/components/ui";

const links = [
  { href: "/history", label: "History" },
  { href: "/usage", label: "Usage" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const { items, error } = useConversations(user?.uid, 20);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Wordmark href="/chat" />
        <button className="text-text-muted md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          ✕
        </button>
      </div>
      <ButtonLink href="/chat" className="w-full">
        + New chat
      </ButtonLink>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Recent</p>
        {error && <p className="px-2 text-xs text-danger">{error}</p>}
        {items === undefined && <p className="px-2 text-xs text-text-muted">Loading…</p>}
        {items?.length === 0 && <p className="px-2 text-xs text-text-muted">No conversations yet.</p>}
        <ul className="space-y-0.5">
          {items?.map((c) => {
            const href = `/chat/${c.id}`;
            const active = pathname === href;
            return (
              <li key={c.id}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block truncate rounded-md px-2 py-1.5 text-sm ${
                    active ? "bg-surface-raised text-text" : "text-text-muted hover:bg-surface-raised hover:text-text"
                  }`}
                >
                  {c.title || "Untitled chat"}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <nav className="space-y-0.5 border-t border-border pt-3" aria-label="Account">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={`block rounded-md px-2 py-1.5 text-sm ${
              pathname === l.href ? "bg-surface-raised text-text" : "text-text-muted hover:text-text"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <button onClick={signOut} className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-text-muted hover:text-text">
          Sign out
        </button>
      </nav>
      <p className="truncate px-2 text-xs text-text-muted">{profile?.displayName ?? user?.email}</p>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <button onClick={() => setOpen(true)} className="text-text-muted" aria-label="Open menu">
          ☰
        </button>
        <Wordmark href="/chat" />
        <span className="w-5" />
      </div>
      <aside className="hidden w-72 shrink-0 border-r border-border bg-surface/70 md:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-surface">{content}</aside>
        </div>
      )}
    </>
  );
}
