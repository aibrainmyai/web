"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firebase } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useConversations } from "@/lib/conversations";
import { Button, Notice, Spinner } from "@/components/ui";

export default function HistoryPage() {
  const { user } = useAuth();
  const { items, error } = useConversations(user?.uid, 100);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [actionError, setActionError] = useState("");

  // Title-only search in version 1: Firestore cannot search inside message text (decision 7).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items?.filter((c) => c.title.toLowerCase().includes(q)) : items;
  }, [items, search]);

  async function update(id: string, data: { title?: string; archived?: boolean }) {
    if (!user) return;
    setActionError("");
    try {
      await updateDoc(doc(firebase().db, "users", user.uid, "conversations", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch {
      setActionError("Could not save that change. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">History</h1>
      <label htmlFor="search" className="sr-only">Search by title</label>
      <input
        id="search"
        type="search"
        placeholder="Search by title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
      />
      {error && <Notice tone="error">{error}</Notice>}
      {actionError && <div className="mb-4"><Notice tone="error">{actionError}</Notice></div>}
      {filtered === undefined && <Spinner />}
      {filtered?.length === 0 && (
        <p className="text-text-muted">{search ? "No conversations match that title." : "No conversations yet."}</p>
      )}
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface/60">
        {filtered?.map((c) => (
          <li key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
            {editing === c.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const title = draft.trim().slice(0, 120);
                  if (title) await update(c.id, { title });
                  setEditing(null);
                }}
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-label="Conversation title"
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
                />
                <Button type="submit" className="py-1.5">Save</Button>
                <Button type="button" variant="ghost" className="py-1.5" onClick={() => setEditing(null)}>Cancel</Button>
              </form>
            ) : (
              <>
                <Link href={`/chat/${c.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.title || "Untitled chat"}</p>
                  <p className="truncate text-sm text-text-muted">
                    {c.updatedAt?.toDate?.().toLocaleDateString()} · {c.preview}
                  </p>
                </Link>
                <div className="flex gap-1">
                  <Button variant="ghost" className="py-1.5" onClick={() => { setEditing(c.id); setDraft(c.title); }}>
                    Rename
                  </Button>
                  {/* Deleting needs the deleteConversation function (removes messages and files); archive for now. */}
                  <Button variant="ghost" className="py-1.5" onClick={() => update(c.id, { archived: true })}>
                    Archive
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
