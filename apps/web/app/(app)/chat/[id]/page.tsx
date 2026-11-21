"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import type { Conversation, Message, WithId } from "@myai/shared-types";
import { firebase } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { Composer } from "@/components/app/Composer";
import { Notice, Spinner } from "@/components/ui";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [conv, setConv] = useState<Conversation | null | undefined>(undefined);
  const [messages, setMessages] = useState<WithId<Message>[]>([]);

  useEffect(() => {
    if (!user || !id) return;
    const { db } = firebase();
    const convRef = doc(db, "users", user.uid, "conversations", id);
    const unsubConv = onSnapshot(
      convRef,
      (s) => setConv(s.exists() ? (s.data() as Conversation) : null),
      () => setConv(null),
    );
    const unsubMsgs = onSnapshot(
      query(collection(convRef, "messages"), orderBy("createdAt", "asc")),
      (s) => setMessages(s.docs.map((d) => ({ id: d.id, ...(d.data() as Message) }))),
      () => setMessages([]),
    );
    return () => {
      unsubConv();
      unsubMsgs();
    };
  }, [user, id]);

  if (conv === undefined) return <Spinner label="Loading conversation" />;
  if (conv === null)
    return (
      <div className="mx-auto max-w-xl p-8">
        <Notice tone="error">This conversation does not exist or was deleted.</Notice>
      </div>
    );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border px-4 py-3">
        <h1 className="mx-auto max-w-3xl truncate font-bold">{conv.title || "Untitled chat"}</h1>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-6">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {/* Plain text for now; safe markdown rendering arrives with the chat engine (phase 5). */}
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm ${
                m.role === "user" ? "bg-brand-gradient text-white" : "border border-border bg-surface"
              }`}
            >
              {m.content}
              {m.status === "error" && <p className="mt-2 text-xs text-danger">This reply failed.</p>}
              {m.status === "stopped" && <p className="mt-2 text-xs text-text-muted">Stopped.</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-0">
        <Composer />
      </div>
    </div>
  );
}
