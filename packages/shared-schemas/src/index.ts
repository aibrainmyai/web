import { z } from "zod";

/** Zod schemas shared by the apps and Cloud Functions. Unknown fields are refused (PLAN section 14). */

export const languageSchema = z.enum(["en", "ms", "zh", "ta"]);

export const bootstrapAccountInput = z
  .object({
    language: languageSchema.optional(),
  })
  .strict();
export type BootstrapAccountInput = z.infer<typeof bootstrapAccountInput>;

export const bootstrapAccountOutput = z.object({
  created: z.boolean(),
});
export type BootstrapAccountOutput = z.infer<typeof bootstrapAccountOutput>;

/** Profile fields the owner may change directly in Firestore (mirrors firestore.rules). */
export const profileUpdate = z
  .object({
    displayName: z.string().trim().min(1).max(60),
    language: languageSchema,
    memoryEnabled: z.boolean(),
  })
  .partial()
  .strict();
export type ProfileUpdate = z.infer<typeof profileUpdate>;

export const emailSchema = z.email("Enter a valid email address");
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters");

export const registerForm = z.object({
  displayName: z.string().trim().min(1, "Enter your name").max(60),
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal(true, { error: "You must accept the terms to continue" }),
});

export const loginForm = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});
