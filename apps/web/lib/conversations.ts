"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import type { Conversation, WithId } from "@myai/shared-types";
import { firebase } from "./firebase";

/**
 * Live list of the user's active conversations, newest first. Uses the composite index
 * conversations(archived asc, updatedAt desc) from firebase/firestore.indexes.json.
 * `items` is undefined while loading.
 */
export function useConversations(uid: string | undefined, max = 20) {
  const [items, setItems] = useState<WithId<Conversation>[] | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(firebase().db, "users", uid, "conversations"),
      where("archived", "==", false),
      orderBy("updatedAt", "desc"),
      limit(max),
    );
    return onSnapshot(
      q,
      (snap) => {
        setError(undefined);
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Conversation) })));
      },
      () => {
        setItems([]);
        setError("Could not load your conversations.");
      },
    );
  }, [uid, max]);

  return { items, error };
}
