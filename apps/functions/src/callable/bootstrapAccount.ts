import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { z } from "zod";
import { auth, REGION } from "../core/firebase.js";
import { usersRepo } from "../core/repositories/users.js";

// Mirrors bootstrapAccountInput in packages/shared-schemas. The functions build will import the
// shared package directly once workspace packages are bundled for deploy (phase 2 task).
const input = z.object({ language: z.enum(["en", "ms", "zh", "ta"]).optional() }).strict();

/**
 * Called by the app on first sign-in (PLAN section 12, step 2). Creates users/{uid} and sets the
 * default role claim. Safe to call more than once.
 */
export const bootstrapAccount = onCall(
  {
    region: REGION,
    // App Check enforcement is switched on in phase 4 after a monitoring period (PLAN section 6).
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");

    const parsed = input.safeParse(request.data ?? {});
    if (!parsed.success) throw new HttpsError("invalid-argument", "Invalid request.");

    const uid = request.auth.uid;
    const token = request.auth.token;
    const email = typeof token.email === "string" ? token.email : "";
    const displayName =
      (typeof token.name === "string" && token.name.trim()) || email.split("@")[0] || "MYai user";

    const created = await usersRepo.createIfMissing(uid, {
      displayName: displayName.slice(0, 60),
      photoURL: typeof token.picture === "string" ? token.picture : null,
      language: parsed.data.language ?? "en",
    });

    if (!token.role) {
      const user = await auth.getUser(uid);
      await auth.setCustomUserClaims(uid, { ...(user.customClaims ?? {}), role: "user" });
    }

    // Never log message text or personal data; uid only (PLAN section 14).
    logger.info("bootstrapAccount", { uid, created });
    return { created };
  },
);
