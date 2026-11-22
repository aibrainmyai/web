import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebase } from "./firebase";

/**
 * Consent records (PLAN section 12, step 3). The rules allow a consent document to be created once and never
 * changed, so each version gets its own document id (for example "terms-2026-11"). Raising CONSENT_VERSION makes
 * every user accept again without needing an update.
 */
export const CONSENT_VERSION = "2026-11";
const TYPES = ["terms", "privacy", "ai_processing"] as const;

const idFor = (type: (typeof TYPES)[number]) => `${type}-${CONSENT_VERSION}`;

export async function hasCurrentConsents(uid: string): Promise<boolean> {
  const { db } = firebase();
  const snaps = await Promise.all(TYPES.map((t) => getDoc(doc(db, "users", uid, "consents", idFor(t)))));
  return snaps.every((s) => s.exists());
}

/** Safe to call twice: documents that already exist are skipped (the rules refuse overwrites). */
export async function recordConsents(uid: string): Promise<void> {
  const { db } = firebase();
  for (const type of TYPES) {
    const ref = doc(db, "users", uid, "consents", idFor(type));
    if ((await getDoc(ref)).exists()) continue;
    await setDoc(ref, { version: CONSENT_VERSION, acceptedAt: serverTimestamp() });
  }
}
