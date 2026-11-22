"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { createApiClient } from "@myai/api-client";
import type { LanguageCode, UserProfile } from "@myai/shared-types";
import { firebase } from "./firebase";

interface AuthState {
  /** undefined while Firebase is still checking, null when signed out. */
  user: User | null | undefined;
  /** The users/{uid} document. undefined until the account is ready. */
  profile: UserProfile | null | undefined;
  /** Set when the account could not be prepared (network, function not deployed). */
  bootstrapError: string | null;
  retry: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// The register form signs the user in and then sets their name. Account creation waits for it so the
// profile gets the name they typed instead of the part of their email before the @.
let registrationGate: Promise<void> = Promise.resolve();

/** Call before createUserWithEmailAndPassword; call the returned function when the registration steps are done. */
export function holdAccountSetup(): () => void {
  let release!: () => void;
  registrationGate = new Promise<void>((resolve) => (release = resolve));
  return release;
}

function browserLanguage(): LanguageCode {
  const l = typeof navigator === "undefined" ? "en" : navigator.language.toLowerCase();
  if (l.startsWith("ms")) return "ms";
  if (l.startsWith("zh")) return "zh";
  if (l.startsWith("ta")) return "ta";
  return "en";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => onAuthStateChanged(firebase().auth, (u) => setUser(u)), []);

  useEffect(() => {
    if (!user) {
      setProfile(undefined);
      setBootstrapError(null);
      return;
    }
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        await registrationGate;
        const { db, functions } = firebase();
        const userRef = doc(db, "users", user.uid);

        // Returning users already have a profile and a role claim, so skip the function call (and its cold start).
        const token = await user.getIdTokenResult();
        const existing = await getDoc(userRef);
        if (!existing.exists() || !token.claims.role) {
          await user.getIdToken(true); // puts the name set at registration into the token the function reads
          await createApiClient(functions).bootstrapAccount({ language: browserLanguage() });
          await user.getIdToken(true); // brings the new role claim into the token
        }
        if (cancelled) return;
        setBootstrapError(null);
        unsubscribe = onSnapshot(
          userRef,
          (s) => setProfile(s.exists() ? (s.data() as UserProfile) : null),
          () => setProfile(null),
        );
      } catch {
        if (!cancelled) setBootstrapError("We could not set up your account. Check your connection and try again.");
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user, attempt]);

  const retry = useCallback(() => {
    setBootstrapError(null);
    setAttempt((n) => n + 1);
  }, []);
  const signOut = useCallback(() => fbSignOut(firebase().auth), []);

  const value = useMemo(
    () => ({ user, profile, bootstrapError, retry, signOut }),
    [user, profile, bootstrapError, retry, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Friendly text for Firebase Auth errors. Wrong email and wrong password get the same message on purpose. */
export function authErrorMessage(err: unknown): string {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 8 characters).";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "No connection. Check your internet and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window. Allow pop-ups and try again.";
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a different sign-in method.";
    case "auth/unauthorized-domain":
      return "This website address is not authorised for sign-in yet.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support.";
    default:
      return "Something went wrong. Please try again.";
  }
}
