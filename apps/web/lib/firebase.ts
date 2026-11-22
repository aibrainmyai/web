import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

/** Must match REGION in apps/functions/src/core/firebase.ts. The client default (us-central1) would miss every function. */
export const FUNCTIONS_REGION = "asia-southeast1";

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  functions: Functions;
  storage: FirebaseStorage;
}

// Next.js reloads modules during development, and connect*Emulator may run only once per instance,
// so the services are cached on globalThis.
const g = globalThis as unknown as { __myaiFirebase?: FirebaseServices };

/**
 * Lazily creates the Firebase services. Switch between the real project and the local Emulator Suite with
 * NEXT_PUBLIC_USE_EMULATORS (see .env.example). Each NEXT_PUBLIC_ variable is written out in full because
 * Next.js replaces them at build time; process.env[name] would come back empty in the browser.
 */
export function firebase(): FirebaseServices {
  if (g.__myaiFirebase) return g.__myaiFirebase;

  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });

  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const storage = getStorage(app);

  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    // Ports match firebase/firebase.json.
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  }

  return (g.__myaiFirebase = { app, auth, db, functions, storage });
}
