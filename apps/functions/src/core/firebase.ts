import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) initializeApp();

/**
 * Only files under core/repositories may import `db` (PLAN section 9).
 * A lint rule will enforce this once linting is set up.
 */
export const db = getFirestore();
export const auth = getAuth();

export const REGION = "asia-southeast1";
