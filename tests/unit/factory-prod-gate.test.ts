import { afterEach, describe, expect, it } from "vitest";

/**
 * Regression test for the MOCK_MODE-in-production safety gate. We mutate the
 * env module's exported values directly because `process.env.NODE_ENV` is
 * readonly under `@types/node` v22+. The gate reads `env.NODE_ENV` and
 * `env.MOCK_MODE` at the moment `build()` runs.
 */
describe("adapter factory production gate", () => {
  afterEach(async () => {
    // Restore test defaults so the rest of the suite isn't affected.
    const envMod = await import("@/lib/env");
    Object.defineProperty(envMod.env, "NODE_ENV", { value: "test", writable: true });
    Object.defineProperty(envMod.env, "MOCK_MODE", { value: true, writable: true });
    const { resetAdapters } = await import("@/lib/ai/factory");
    resetAdapters();
  });

  it("refuses to build mock adapters when NODE_ENV=production", async () => {
    const envMod = await import("@/lib/env");
    Object.defineProperty(envMod.env, "MOCK_MODE", { value: true, writable: true });
    Object.defineProperty(envMod.env, "NODE_ENV", { value: "production", writable: true });
    const { resetAdapters, adapters } = await import("@/lib/ai/factory");
    resetAdapters();
    expect(() => adapters()).toThrow(/MOCK_MODE.*not permitted.*production/i);
  });

  it("builds mock adapters fine in non-production", async () => {
    const envMod = await import("@/lib/env");
    Object.defineProperty(envMod.env, "NODE_ENV", { value: "test", writable: true });
    Object.defineProperty(envMod.env, "MOCK_MODE", { value: true, writable: true });
    const { resetAdapters, adapters } = await import("@/lib/ai/factory");
    resetAdapters();
    expect(() => adapters()).not.toThrow();
  });
});
