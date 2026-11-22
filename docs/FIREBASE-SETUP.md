> **Status after the "web foundation" patch:** problems A, B and C in section 0 are fixed in the repository
> (`apps/web/lib/` is tracked, `allowBuilds` is set, Functions have a `predeploy` build). Sections 1, 2 and 8 step 1
> are kept only as background. `pnpm seed:emulator` (and the `--confirm` form in `apps/functions/scripts/seed-plans.mjs`)
> creates the plan documents the Usage page needs. `pnpm test:rules` runs the security-rules tests.

# Connect MYai (GitHub repo `aibrainmyai/web`) to your Firebase account

Written 22 Nov 2026 against commit `5f8cb82` ("Scaffold MYai monorepo and web app foundation").
Everything below was checked against the real files in that repo. Steps that need your Google account (the Firebase console, `firebase login`) I could not run, so those are written from the Firebase docs and the repo's config, not from a live test.

---

## 0. Read this first: 3 problems in the repo that block everything

I cloned the repo, ran `pnpm install`, built the functions and type-checked the web app. Results:

| # | Problem | What happens | Fix |
|---|---------|--------------|-----|
| A | **`apps/web/lib/` is not on GitHub.** `.gitignore` line 4 is `lib/`, which matches *every* folder named `lib`, not just the Functions build output. | The web app imports `@/lib/firebase`, `@/lib/auth`, `@/lib/consent`, `@/lib/conversations`, `@/lib/useRedirectIfSignedIn`. None exist in the repo. `pnpm --filter @myai/web typecheck` fails with "Cannot find module '@/lib/…'" on every auth page. A fresh clone cannot build, and App Hosting / Vercel would fail too. | Section 1 |
| B | **`pnpm install` exits with an error** on a fresh clone: `ERR_PNPM_IGNORED_BUILDS` for `@firebase/util`, `protobufjs`, `re2`. pnpm 12 blocks install scripts by default. | CI would fail at the install step. | Section 2 |
| C | **No `predeploy` build for Functions.** `apps/functions/lib/` (the compiled code) is gitignored and `firebase.json` has no build hook. | `firebase deploy --only functions` would upload nothing runnable. | Section 8 |

What I could confirm works: `pnpm --filter @myai/functions build` compiles cleanly (it warns that my sandbox has Node 22 while the package asks for Node 24, which is fine on your side if you run Node 24).

The Firebase client files (A) almost certainly exist on the machine where the other agent worked, they were just never committed. Check there first (Section 1, step 1).

---

## 1. Fix problem A: get `apps/web/lib/` into GitHub

Run these on the machine where the code lives (inside the repo folder).

**Step 1. See whether the files exist locally**
```bash
ls apps/web/lib
git check-ignore -v apps/web/lib/firebase.ts
```
- If the folder has `firebase.ts`, `auth.tsx`, `consent.ts`, `conversations.ts`, `useRedirectIfSignedIn.ts` → go to step 2.
- If the folder is missing or empty → the files have to be (re)written. Section 1b gives a reference `firebase.ts`. The other four are app logic the other agent has to supply or rewrite (see the list of what each must export in 1b).

**Step 2. Stop ignoring the folder.** In `.gitignore`, replace the line `lib/` with:
```
/apps/functions/lib/
```
(`apps/functions/lib` is the only compiled-output folder you want ignored. Packages and web use no `lib` build output.)

**Step 3. Commit and push**
```bash
git add .gitignore apps/web/lib
git status          # confirm the five lib files are listed
git commit -m "Track apps/web/lib and only ignore Functions build output"
git push
```

**Step 4. Prove it on a clean clone** (this is the test that matters)
```bash
cd /tmp && git clone https://github.com/aibrainmyai/web check && cd check
pnpm install --frozen-lockfile      # needs the Section 2 fix first
pnpm --filter @myai/web typecheck
```
It must finish with no errors.

### 1b. Reference `apps/web/lib/firebase.ts`

The web pages call `firebase().auth` and `firebase().db`, so the helper must return an object with those. Settings/history/profile pages use `.db`. Add `functions` for the `bootstrapAccount` call and `storage` for attachments later.

```ts
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

/** Must match REGION in apps/functions/src/core/firebase.ts. */
export const FUNCTIONS_REGION = "asia-southeast1";

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  functions: Functions;
  storage: FirebaseStorage;
}

// Next.js dev reloads modules often. connect*Emulator may only run once per instance,
// so the instance is cached on globalThis.
const g = globalThis as unknown as { __myaiFirebase?: FirebaseServices };

export function firebase(): FirebaseServices {
  if (g.__myaiFirebase) return g.__myaiFirebase;

  // Each NEXT_PUBLIC_ variable must be written out in full like this. Next.js replaces
  // them at build time, and dynamic lookups such as process.env[name] come back empty.
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
  const functions = getFunctions(app, FUNCTIONS_REGION); // default is us-central1: wrong region = "not-found"
  const storage = getStorage(app);

  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  }

  return (g.__myaiFirebase = { app, auth, db, functions, storage });
}
```
Ports 9099 / 8080 / 5001 / 9199 are the ones already set in `firebase/firebase.json`.

What the other four files must provide (taken from how the pages use them):

| File | Exports the pages expect |
|------|---------------------------|
| `lib/auth.tsx` | `AuthProvider`, `useAuth()` returning `{ user, profile, signOut }` (`user` is `undefined` while loading, `null` when signed out; `profile` is the `users/{uid}` document typed as `UserProfile`), and `authErrorMessage(err)`. **It must call `bootstrapAccount` after sign-in** (see Section 7), then subscribe to `users/{uid}`. |
| `lib/consent.ts` | `hasCurrentConsents(uid)` and `recordConsents(uid)`. Writes `users/{uid}/consents/{type}` with **only** the keys `version` and `acceptedAt` (the rules reject anything else). |
| `lib/conversations.ts` | `useConversations()` reading `users/{uid}/conversations` (ordered by `updatedAt` desc, `archived == false`; this is what the composite index in `firestore.indexes.json` is for). |
| `lib/useRedirectIfSignedIn.ts` | Hook that sends a signed-in user to `/chat` (or the `?next=` path). |

---

## 2. Fix problem B: `pnpm install` failing

Tested on pnpm 12.21.0: adding this to the end of `pnpm-workspace.yaml` makes the install finish cleanly (all three packages built):

```yaml
allowBuilds:
  "@firebase/util": true
  protobufjs: true
  re2: true
```
Commit it. (`onlyBuiltDependencies`, the older setting name, did **not** work on pnpm 12 in my test.)

---

## 3. Create the Firebase projects (console, about 20 minutes)

You need two real projects plus the local emulator. The repo's `firebase/.firebaserc` already has the aliases:

```json
{ "projects": { "default": "demo-myai", "dev": "myai-dev", "prod": "myai-prod" } }
```
`demo-myai` is emulator-only (never touches the cloud). `myai-dev` and `myai-prod` are **placeholders**. Project IDs are globally unique and permanent, so yours will probably be different.

**Step 1. Create the dev project**
1. Go to https://console.firebase.google.com → **Create a project**.
2. Name it `MYai Dev`. Note the **Project ID** shown under the name (e.g. `myai-dev-48213`). You cannot change it later.
3. Google Analytics: you can leave it off for dev.
4. Use a **new** project for MYai. Do not reuse the Lovia project (`lovia-b8657`): mixing users, rules and billing between two products causes problems later.

**Step 2. Upgrade to Blaze (pay-as-you-go)**
Cloud Functions, App Hosting and scheduled backups need Blaze. In the console: **Usage and billing → Details & settings → Modify plan → Blaze**, attach a billing account.
Immediately after, set a **budget alert**: Google Cloud console → **Billing → Budgets & alerts → Create budget** (e.g. RM100 with alerts at 50/90/100%). Blaze has no hard spending cap; alerts only notify you. This matters because the AI calls cost money.

**Step 3. Create Firestore**
Console → **Build → Firestore Database → Create database**.
- Edition: Standard, mode: **Production** (the repo's rules get deployed next, deny by default).
- Location: **asia-southeast1 (Singapore)**. **This is permanent.** It also matches the Functions region in the code.

**Step 4. Create Storage**
Console → **Build → Storage → Get started** → same location, asia-southeast1. Firebase may require Blaze before it lets you create the default bucket, which you have already done in step 2. Copy the bucket name it shows (newer projects look like `myai-dev-48213.firebasestorage.app`, older ones `….appspot.com`). Use whatever the console shows, not the `.appspot.com` form from `.env.example`.

**Step 5. Repeat for production**
Same steps with `MYai` (prod): own project ID, own Blaze plan, own budget, Singapore. Keep dev and prod fully separate.

**Step 6. Put your real project IDs in the repo.** Edit `firebase/.firebaserc`:
```json
{ "projects": { "default": "demo-myai", "dev": "<your-dev-project-id>", "prod": "<your-prod-project-id>" } }
```
Project IDs are not secret, so this file is safe to commit.

---

## 4. Register the web app and get the config

1. In the **dev** project: ⚙ **Project settings → General → Your apps → Add app → Web (`</>`)**.
2. Nickname `MYai Web (dev)`. Do **not** tick Firebase Hosting (we use App Hosting or Vercel).
3. Firebase shows a `firebaseConfig` block. You need five values.
4. Create `apps/web/.env.local` (gitignored, so it will not be committed):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=<apiKey>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<projectId>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<projectId>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<storageBucket as shown>
NEXT_PUBLIC_FIREBASE_APP_ID=<appId>
NEXT_PUBLIC_USE_EMULATORS=false
```
`NEXT_PUBLIC_USE_EMULATORS=false` is what points the app at the real cloud project. With `true` it talks to the local emulators instead.

Notes:
- The web API key is not a secret (it only identifies the project; the rules and Auth protect the data). It is still kept out of Git so dev and prod values do not get mixed.
- Do the same for the prod project later; those values go into the hosting provider's environment settings, not into a file.
- Restart `pnpm dev` after changing `.env.local`. Next.js reads it only at start.

---

## 5. Turn on sign-in methods

**Console → Build → Authentication → Get started → Sign-in method.**

| Provider | What to do | Needed by |
|----------|-----------|-----------|
| **Email/Password** | Enable. Leave "Email link" off. | `login`, `register`, `forgot-password` pages |
| **Google** | Enable, choose a support email. | the "Continue with Google" button (`signInWithPopup`) |
| **Apple** | Later, when the iOS app exists. Needs an Apple Developer account. | iOS (Apple requires Sign in with Apple when you offer Google) |

**Authorized domains** (Authentication → Settings → Authorized domains). Add every domain the web app will run on:
- `localhost` is there by default.
- your real domain (e.g. `myai.my`) and `www.`
- the hosting preview domain once you know it (e.g. `*.web.app` is added automatically for Firebase Hosting but **not** for Vercel or App Hosting custom domains).

If Google sign-in shows `auth/unauthorized-domain`, this list is the cause.

Optional but recommended: **Authentication → Templates** → set the sender name and language for the verify-email and password-reset emails (the register page sends a verification email).

---

## 6. Install the CLI, log in and deploy the rules

The repo already pins `firebase-tools` 15.37.0 as a dev dependency, so no global install is needed.

```bash
pnpm install                       # after the Section 2 fix
pnpm exec firebase login           # opens a browser; sign in with the Google account that owns the projects
pnpm exec firebase projects:list   # your dev and prod IDs should appear
```

Run Firebase commands **from the `firebase/` folder**. That is where `firebase.json` and `.firebaserc` live, and the paths inside (`../apps/functions`) are written relative to it:

```bash
cd firebase
pnpm exec firebase use dev                                  # alias from .firebaserc
pnpm exec firebase deploy --only firestore:rules,firestore:indexes,storage
```
This publishes `firestore.rules`, `firestore.indexes.json` and `storage.rules`. Index building can take a few minutes; check **Firestore → Indexes** shows "Enabled".

To confirm the rules are live: Console → Firestore → **Rules** tab should show "deny by default" and the `users/{uid}` block.

(The root script `pnpm emulators` uses `--config firebase/firebase.json` from the repo root. I did not run the emulators in my sandbox because the Firestore emulator needs Java, so treat the local-emulator steps below as untested by me.)

---

## 7. Make the account flow work end to end

The Firestore rules say `users/{uid}` **cannot be created from the app** (`allow create: if false`). Only the `bootstrapAccount` Cloud Function creates it. So after any sign-in or sign-up (email or Google), the app must call it once, otherwise the user has no profile document and the app sits on its loading spinner.

In `lib/auth.tsx` (inside `AuthProvider`), the sequence should be:

1. `onAuthStateChanged(auth, user => …)`
2. If a user exists: `await api.bootstrapAccount({ language })` where `api = createApiClient(firebase().functions)` from `@myai/api-client`. The function is idempotent, so calling it on every sign-in is fine.
3. Force a token refresh once, `await user.getIdToken(true)`, so the new `role: "user"` custom claim is in the token.
4. Subscribe with `onSnapshot(doc(db, "users", user.uid), …)` and expose that as `profile`.

Things to know:
- The function lives in **asia-southeast1**. If `getFunctions()` is created without that region, the call fails with `functions/not-found`. (`firebase.ts` in 1b already sets it.)
- `register/page.tsx` calls `recordConsents(uid)` before bootstrap runs. That is fine for the rules (consents only check the key names), but `hasCurrentConsents` must not assume the profile exists yet.
- `bootstrapAccount` has `enforceAppCheck: false` for now. Leave it until Section 10.

---

## 8. Deploy the Cloud Functions (fix problem C)

**What is in the repo:** one function, `bootstrapAccount`, TypeScript, ESM, Node 24 (`engines.node = "24"`, `firebase.json` runtime `nodejs24`), region asia-southeast1.

**Step 1. Add a build step before deploy.** In `firebase/firebase.json`, change the functions entry to:
```json
"functions": [
  {
    "source": "../apps/functions",
    "codebase": "default",
    "runtime": "nodejs24",
    "predeploy": ["pnpm --filter @myai/functions build"]
  }
]
```
Predeploy hooks run in the project folder; if the command cannot find pnpm or the workspace, use `"npm --prefix \"$RESOURCE_DIR\" run build"` instead. Test it once and look for a `lib/index.js` afterwards.

**Step 2. Check the runtime is available.** Node 24 for 2nd-gen functions is recent. If the deploy says the runtime is unsupported, drop both `engines.node` and `runtime` to 22 (the repo's root engine requirement is `>=22`, so this is safe). I could not test a live deploy, so this is the first thing to try if it fails.

**Step 3. Deploy**
```bash
cd firebase
pnpm exec firebase use dev
pnpm exec firebase deploy --only functions
```
First deploy asks to enable several Google APIs (Cloud Functions, Cloud Build, Artifact Registry, Eventarc, Cloud Run); answer yes. It can take 5 to 10 minutes.

**Known limitation to be aware of:** the functions package has no `@myai/*` workspace dependencies today (the shared schema is duplicated inside `bootstrapAccount.ts`, with a comment saying so). That is why the deploy can work at all. The moment someone imports `@myai/shared-schemas` into Functions, Cloud Build will fail because it cannot resolve workspace packages. That is the "phase 2" bundling task already noted in the code. Do not import workspace packages into Functions until it is done.

**Step 4. Check it:** Console → **Functions** should list `bootstrapAccount` in `asia-southeast1`. Test by signing up in the web app, then confirm a `users/<uid>` document appears in Firestore with `planId: "free"` and `role: "user"`.

---

## 9. Add the OpenAI key (needed in phase 5, not for sign-in)

Do this only when `chatStream` exists. The key never goes in the repo, `.env`, or any `NEXT_PUBLIC_` variable.

```bash
cd firebase
pnpm exec firebase functions:secrets:set OPENAI_API_KEY      # paste the key when asked
```
Then the function declares `secrets: ["OPENAI_API_KEY"]` in its options and reads `process.env.OPENAI_API_KEY` at run time. Set a monthly spend limit on the OpenAI dashboard as well; Google's budget alert does not cap OpenAI.

---

## 10. App Check (turn on after everything above works)

App Check blocks traffic that does not come from your real apps. Plan: register first, watch, enforce later.
1. Console → **Build → App Check → Apps → Web** → register with reCAPTCHA Enterprise (or Turnstile; the plan left the provider open).
2. Add `initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider("<site key>") })` in `firebase.ts` **only when emulators are off** (App Check is not emulated), with a debug token for local development.
3. Watch the **Metrics** tab for a week. Only then click **Enforce** for Firestore, Storage and Functions, and flip `enforceAppCheck` to `true` in `bootstrapAccount`.
4. Android (Play Integrity) and iOS (App Attest) are registered later when the mobile apps exist.

---

## 11. Run it locally against the emulators (no cloud, no cost)

Needs Java 21+ (for the Firestore emulator) and the Node version in `engines`.

```bash
# terminal 1 (repo root)
pnpm --filter @myai/functions build
pnpm emulators                   # Auth 9099, Firestore 8080, Functions 5001, Storage 9199, UI http://127.0.0.1:4000

# terminal 2
# in apps/web/.env.local set:
#   NEXT_PUBLIC_USE_EMULATORS=true
#   NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-myai   (values from .env.example are fine)
pnpm dev
```
Open http://localhost:3000, register an account, then watch it appear in the Emulator UI (Authentication and Firestore tabs). Google sign-in in the emulator shows a fake account picker, which is expected. Rebuild functions (`pnpm --filter @myai/functions dev` keeps `tsc` in watch mode) after changing function code.

---

## 12. Host the web app

Two options. Pick one before you build more; neither is tested on this repo yet.

| | Firebase App Hosting (plan's first choice) | Vercel (fallback) |
|---|---|---|
| Fit | Same console as everything else, GitHub auto-deploy | Easiest for Next.js |
| Risk | Documented for Next.js 13.5 to 15.x; this repo uses 15.5.29, so it fits. Monorepo (`apps/web` inside pnpm workspace) support is **unproven** | None for Next; adds a second vendor |
| Setup | Console → **App Hosting → Get started** → connect GitHub repo `aibrainmyai/web` → **Root directory `apps/web`** → live branch `main` → add the five `NEXT_PUBLIC_*` variables as environment variables for the backend | Import the repo, Root Directory `apps/web`, add the same variables |

For either: set `NEXT_PUBLIC_USE_EMULATORS=false`, then add the live hostname to Firebase Auth → Authorized domains (Section 5), then test sign-in on the live URL.

---

## 13. GitHub Actions: deploy automatically (optional, do last)

Do not store a long-lived service-account key if you can avoid it. Use **Workload Identity Federation** (Google's keyless method for GitHub), or if that is too much for now, a deploy-only service account key in a GitHub secret.

Minimum safe setup:
1. Google Cloud console → IAM → Service Accounts → create `github-deployer` in the dev project. Give it only: *Firebase Rules Admin*, *Cloud Functions Admin*, *Service Account User*, *Cloud Datastore Index Admin* (plus *Firebase Admin* if a role is missing and you accept that it is broader).
2. Add the credential as a GitHub repo secret (**Settings → Secrets and variables → Actions**), e.g. `GCP_SA_KEY` or the Workload Identity settings. Never in a file.
3. Workflow: on push to `main` → `pnpm install --frozen-lockfile` → `pnpm typecheck` → `pnpm build` → `firebase deploy --only firestore,storage,functions --project dev`.
4. Production deploys go through a separate workflow that needs a manual approval (GitHub **Environments → Required reviewers**).

I can write the workflow file once you tell me whether you want WIF or a key.

---

## 14. Verification checklist

Tick these in order. Stop at the first failure.

- [ ] Fresh clone: `pnpm install --frozen-lockfile` succeeds (Section 2)
- [ ] Fresh clone: `pnpm --filter @myai/web typecheck` has 0 errors (Section 1)
- [ ] `pnpm --filter @myai/functions build` creates `apps/functions/lib/index.js`
- [ ] Dev project: Blaze on, budget alert set, Firestore + Storage in Singapore
- [ ] `firebase/.firebaserc` has your real dev and prod IDs
- [ ] `apps/web/.env.local` has the five real values; no `.env.local` shows in `git status`
- [ ] Email/Password and Google enabled; `localhost` authorized
- [ ] Rules and indexes deployed; Rules tab shows deny-by-default; indexes show "Enabled"
- [ ] `bootstrapAccount` visible in Console → Functions, region asia-southeast1
- [ ] Register on http://localhost:3000 → a user appears in Authentication **and** `users/<uid>` appears in Firestore
- [ ] Consent screen appears, you accept, `users/<uid>/consents/…` is written
- [ ] Settings page: change language → the document updates (this proves the rules allow `updatedAt == request.time`)
- [ ] Try to write `planId` or `role` from the browser console → it must be **denied**
- [ ] Sign out, sign in with Google, same result as email
- [ ] Forgot password sends an email

---

## 15. Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '@/lib/firebase'` | Problem A | Section 1 |
| `auth/invalid-api-key` / `auth/configuration-not-found` | `.env.local` missing, a typo, or Email/Google not enabled | Section 4 and 5; restart `pnpm dev` |
| `auth/unauthorized-domain` | Domain not in Authorized domains | Section 5 |
| `functions/not-found` on `bootstrapAccount` | Function not deployed, or client uses `us-central1` | Section 8, and the region in `firebase.ts` |
| `permission-denied` on `users/<uid>` right after sign-up | Profile not created yet (bootstrap not called) | Section 7 |
| `permission-denied` when saving a setting | The write is missing `updatedAt: serverTimestamp()` or includes a forbidden field | Rules in `firestore.rules`; the pages already do this |
| `The query requires an index` | Indexes not deployed or still building | Section 6 |
| Google popup closes immediately | Popup blocker, or the third-party-cookie setting on the browser | Allow the popup; try another browser |
| Deploy: "Billing account required" | Project is on Spark | Section 3, step 2 |
| `ERR_PNPM_IGNORED_BUILDS` | Problem B | Section 2 |
| Works locally, `auth/network-request-failed` after deploy | Left `NEXT_PUBLIC_USE_EMULATORS=true` in the host's environment | Set it to `false` and redeploy |

---

## 16. What this guide does **not** cover yet

- **Mobile (Android/iOS).** The repo has no mobile app. When it does: Expo development builds with React Native Firebase (Expo Go cannot run it), plus `google-services.json` / `GoogleService-Info.plist` per project. That is its own guide.
- **`chatStream`** (the AI reply function), the Composer's Send button, memory/RAG. Phase 5 in the code comments.
- **Admin app and admin custom claims.** `bootstrapAccount` only ever sets `role: "user"`; there is no function to grant `admin` yet.
- **Backups, monitoring, Crashlytics.** In the plan, not in the repo.
- **The ten owner decisions from section 1 of the plan** (brand, pricing, languages, etc.) are still open. None of them block the steps above, but a few (for example the Storage 20 MB / file-type limits in `storage.rules`) are marked "proposal awaiting owner confirmation" in the code.
- I have **read-only** access to the GitHub repo. I did not change anything on GitHub. If you want me to make the fixes in Sections 1, 2 and 8 and open a pull request, say so and I will request push access.

## Security reminders
- Never commit `.env.local`, service-account JSON files, or the OpenAI key.
- Do not paste secrets into chat or into GitHub issues.
- Keep dev and prod as separate projects and separate keys.
