import { httpsCallable, type Functions } from "firebase/functions";
import type { BootstrapAccountInput, BootstrapAccountOutput } from "@myai/shared-schemas";

/**
 * Typed wrappers for the callable Cloud Functions (PLAN section 14).
 * The web passes its `Functions` instance; mobile will get a React Native Firebase variant in phase 3.
 * chatStream (the streaming HTTPS endpoint) is added in phase 5.
 */
export function createApiClient(functions: Functions) {
  return {
    async bootstrapAccount(input: BootstrapAccountInput = {}): Promise<BootstrapAccountOutput> {
      const call = httpsCallable<BootstrapAccountInput, BootstrapAccountOutput>(functions, "bootstrapAccount");
      const res = await call(input);
      return res.data;
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
