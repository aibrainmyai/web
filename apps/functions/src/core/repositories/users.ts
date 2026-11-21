import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase.js";

export type Language = "en" | "ms" | "zh" | "ta";

export interface NewProfile {
  displayName: string;
  photoURL: string | null;
  language: Language;
}

/**
 * Users repository. Every function takes the owner's uid, so no caller can load
 * a user's document without naming its owner (PLAN section 9).
 */
export const usersRepo = {
  /** Creates users/{uid} if it does not exist. Returns true when it was created. Safe to call twice. */
  async createIfMissing(uid: string, profile: NewProfile): Promise<boolean> {
    const ref = db.collection("users").doc(uid);
    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists) return false;
      tx.create(ref, {
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        language: profile.language,
        preferredModelId: null,
        memoryEnabled: false,
        planId: "free",
        role: "user",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
  },
};
