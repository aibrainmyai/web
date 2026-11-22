// Security rules tests (PLAN section 20): signed out, owner, another user, and attempted writes to fields the
// owner may not change. Run with `pnpm test:rules` (needs Java; the script starts the emulators itself).
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getBytes, ref, uploadBytes } from "firebase/storage";

const here = (f) => new URL(`../${f}`, import.meta.url);
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-myai",
    firestore: { rules: readFileSync(here("firestore.rules"), "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync(here("storage.rules"), "utf8"), host: "127.0.0.1", port: 9199 },
  });
});
after(() => env.cleanup());

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const anon = () => env.unauthenticatedContext().firestore();

/** Writes documents as the Admin SDK would (rules disabled), like the Cloud Functions do. */
const seed = (fn) => env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));

beforeEach(async () => {
  await env.clearFirestore();
  await seed(async (db) => {
    await setDoc(doc(db, "users/alice"), { displayName: "Alice", planId: "free", role: "user", language: "en", memoryEnabled: false });
    await setDoc(doc(db, "users/bob"), { displayName: "Bob", planId: "free", role: "user", language: "en", memoryEnabled: false });
    await setDoc(doc(db, "users/alice/conversations/c1"), { title: "Hello", archived: false, messageCount: 2, modelId: "nano" });
    await setDoc(doc(db, "users/alice/conversations/c1/messages/m1"), { role: "user", content: "hi" });
    await setDoc(doc(db, "users/alice/attachments/a1"), { name: "f.pdf" });
    await setDoc(doc(db, "users/alice/user_memory/k1"), { fact: "likes teh tarik" });
    await setDoc(doc(db, "users/alice/knowledge_documents/d1"), { name: "doc" });
    await setDoc(doc(db, "users/alice/knowledge_documents/d1/chunks/ch1"), { text: "x" });
    await setDoc(doc(db, "users/alice/devices/dev1"), { fcmToken: "t", platform: "android", lastSeenAt: 1 });
    await setDoc(doc(db, "subscriptions/alice"), { planId: "free" });
    await setDoc(doc(db, "usage_records/alice_20261122"), { uid: "alice", chats: 1 });
    await setDoc(doc(db, "plans/free"), { name: "Free" });
    await setDoc(doc(db, "system_settings/public"), { maintenanceMode: false });
    await setDoc(doc(db, "audit_logs/l1"), { action: "x" });
  });
});

describe("users/{uid}", () => {
  it("owner reads own profile; signed-out and other users cannot", async () => {
    await assertSucceeds(getDoc(doc(alice(), "users/alice")));
    await assertFails(getDoc(doc(bob(), "users/alice")));
    await assertFails(getDoc(doc(anon(), "users/alice")));
  });
  it("owner may change display fields with a server timestamp", async () => {
    await assertSucceeds(updateDoc(doc(alice(), "users/alice"), { displayName: "Ali", language: "ms", memoryEnabled: true, updatedAt: serverTimestamp() }));
  });
  it("owner may not change plan or role, nor skip the server timestamp", async () => {
    await assertFails(updateDoc(doc(alice(), "users/alice"), { planId: "pro", updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(alice(), "users/alice"), { role: "admin", updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(alice(), "users/alice"), { displayName: "Ali" }));
  });
  it("another user cannot update; nobody creates or deletes from the app", async () => {
    await assertFails(updateDoc(doc(bob(), "users/alice"), { displayName: "Hacked", updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(alice(), "users/alice2"), { displayName: "X" }));
    await assertFails(deleteDoc(doc(alice(), "users/alice")));
  });
});

describe("conversations and messages", () => {
  it("owner reads; others cannot", async () => {
    await assertSucceeds(getDoc(doc(alice(), "users/alice/conversations/c1")));
    await assertFails(getDoc(doc(bob(), "users/alice/conversations/c1")));
    await assertSucceeds(getDoc(doc(alice(), "users/alice/conversations/c1/messages/m1")));
    await assertFails(getDoc(doc(bob(), "users/alice/conversations/c1/messages/m1")));
    await assertFails(getDoc(doc(anon(), "users/alice/conversations/c1/messages/m1")));
  });
  it("owner may rename and archive only", async () => {
    await assertSucceeds(updateDoc(doc(alice(), "users/alice/conversations/c1"), { title: "New", archived: true, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(alice(), "users/alice/conversations/c1"), { modelId: "astra" }));
    await assertFails(updateDoc(doc(alice(), "users/alice/conversations/c1"), { messageCount: 0 }));
  });
  it("the app cannot create or delete conversations, or write messages", async () => {
    await assertFails(setDoc(doc(alice(), "users/alice/conversations/c2"), { title: "x", archived: false }));
    await assertFails(deleteDoc(doc(alice(), "users/alice/conversations/c1")));
    await assertFails(setDoc(doc(alice(), "users/alice/conversations/c1/messages/m2"), { role: "assistant", content: "forged" }));
    await assertFails(updateDoc(doc(alice(), "users/alice/conversations/c1/messages/m1"), { content: "edited" }));
  });
});

describe("other user data", () => {
  it("attachments: owner reads, nobody writes", async () => {
    await assertSucceeds(getDoc(doc(alice(), "users/alice/attachments/a1")));
    await assertFails(getDoc(doc(bob(), "users/alice/attachments/a1")));
    await assertFails(setDoc(doc(alice(), "users/alice/attachments/a2"), { name: "x" }));
  });
  it("user_memory: owner reads and deletes, cannot create or edit", async () => {
    await assertSucceeds(getDoc(doc(alice(), "users/alice/user_memory/k1")));
    await assertFails(getDoc(doc(bob(), "users/alice/user_memory/k1")));
    await assertFails(setDoc(doc(alice(), "users/alice/user_memory/k2"), { fact: "x" }));
    await assertFails(updateDoc(doc(alice(), "users/alice/user_memory/k1"), { fact: "y" }));
    await assertSucceeds(deleteDoc(doc(alice(), "users/alice/user_memory/k1")));
  });
  it("knowledge_documents: owner reads, chunks are server-only", async () => {
    await assertSucceeds(getDoc(doc(alice(), "users/alice/knowledge_documents/d1")));
    await assertFails(getDoc(doc(bob(), "users/alice/knowledge_documents/d1")));
    await assertFails(setDoc(doc(alice(), "users/alice/knowledge_documents/d2"), { name: "x" }));
    await assertFails(getDoc(doc(alice(), "users/alice/knowledge_documents/d1/chunks/ch1")));
  });
  it("devices: owner may register a token with the allowed keys only", async () => {
    await assertSucceeds(setDoc(doc(alice(), "users/alice/devices/dev2"), { fcmToken: "t2", platform: "ios", lastSeenAt: 2 }));
    await assertFails(setDoc(doc(alice(), "users/alice/devices/dev3"), { fcmToken: "t3", platform: "ios", lastSeenAt: 2, admin: true }));
    await assertFails(setDoc(doc(bob(), "users/alice/devices/dev4"), { fcmToken: "t", platform: "ios", lastSeenAt: 1 }));
    await assertSucceeds(deleteDoc(doc(alice(), "users/alice/devices/dev1")));
  });
  it("consents: create once with version and acceptedAt, never edit", async () => {
    const c = (id) => doc(alice(), `users/alice/consents/${id}`);
    await assertSucceeds(setDoc(c("terms-2026-11"), { version: "2026-11", acceptedAt: serverTimestamp() }));
    await assertSucceeds(getDoc(c("terms-2026-11")));
    await assertFails(setDoc(c("terms-2026-11"), { version: "other", acceptedAt: serverTimestamp() }));
    await assertFails(setDoc(c("privacy-2026-11"), { version: "2026-11", acceptedAt: serverTimestamp(), extra: 1 }));
    await assertFails(setDoc(doc(bob(), "users/alice/consents/terms-2026-11"), { version: "2026-11", acceptedAt: serverTimestamp() }));
    await assertFails(deleteDoc(c("terms-2026-11")));
  });
});

describe("top-level collections", () => {
  it("subscriptions: owner reads, nobody writes", async () => {
    await assertSucceeds(getDoc(doc(alice(), "subscriptions/alice")));
    await assertFails(getDoc(doc(bob(), "subscriptions/alice")));
    await assertFails(updateDoc(doc(alice(), "subscriptions/alice"), { planId: "pro" }));
  });
  it("usage_records: owner reads own record only; nobody writes", async () => {
    await assertSucceeds(getDoc(doc(alice(), "usage_records/alice_20261122")));
    await assertFails(getDoc(doc(bob(), "usage_records/alice_20261122")));
    await assertFails(updateDoc(doc(alice(), "usage_records/alice_20261122"), { chats: 0 }));
  });
  it("plans: any signed-in user reads; nobody writes", async () => {
    await assertSucceeds(getDoc(doc(alice(), "plans/free")));
    await assertFails(getDoc(doc(anon(), "plans/free")));
    await assertFails(setDoc(doc(alice(), "plans/free"), { name: "Free for all" }));
  });
  it("system_settings/public: anyone reads; nobody writes", async () => {
    await assertSucceeds(getDoc(doc(anon(), "system_settings/public")));
    await assertFails(setDoc(doc(alice(), "system_settings/public"), { maintenanceMode: true }));
  });
  it("reports: signed-in users file their own, nobody reads", async () => {
    await assertSucceeds(setDoc(doc(alice(), "reports/r1"), { reporterUid: "alice", reason: "bad" }));
    await assertFails(setDoc(doc(alice(), "reports/r2"), { reporterUid: "bob", reason: "bad" }));
    await assertFails(setDoc(doc(anon(), "reports/r3"), { reporterUid: "x" }));
    await assertFails(getDoc(doc(alice(), "reports/r1")));
  });
  it("everything else is closed (audit_logs, unknown collections)", async () => {
    await assertFails(getDoc(doc(alice(), "audit_logs/l1")));
    await assertFails(setDoc(doc(alice(), "anything/x"), { a: 1 }));
  });
});

describe("storage: users/{uid}/attachments/{fileId}", () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const storage = (uid) => env.authenticatedContext(uid).storage();
  const png = { contentType: "image/png" };
  it("owner uploads allowed types; others and signed-out cannot", async () => {
    await assertSucceeds(uploadBytes(ref(storage("alice"), "users/alice/attachments/f1"), bytes, png));
    await assertFails(uploadBytes(ref(storage("bob"), "users/alice/attachments/f2"), bytes, png));
    await assertFails(uploadBytes(ref(env.unauthenticatedContext().storage(), "users/alice/attachments/f3"), bytes, png));
  });
  it("refuses disallowed types, and reads by other users", async () => {
    await assertFails(uploadBytes(ref(storage("alice"), "users/alice/attachments/f4"), bytes, { contentType: "application/x-msdownload" }));
    await assertFails(getBytes(ref(storage("bob"), "users/alice/attachments/f1")));
  });
  it("other paths are closed", async () => {
    await assertFails(uploadBytes(ref(storage("alice"), "public/x.png"), bytes, png));
  });
});
