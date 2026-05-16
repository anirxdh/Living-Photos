import { describe, expect, it } from "vitest";
import { env, isMock } from "@/lib/env";

describe("env", () => {
  it("defaults MOCK_MODE to true in test", () => {
    expect(env.MOCK_MODE).toBe(true);
    expect(isMock).toBe(true);
  });

  it("provides placeholder Stripe keys so callers never get undefined", () => {
    expect(env.STRIPE_SECRET_KEY).toMatch(/^sk_/);
    expect(env.STRIPE_WEBHOOK_SECRET).toMatch(/^whsec_/);
  });

  it("provides a default DATABASE_URL", () => {
    expect(env.DATABASE_URL).toContain("postgres");
  });

  it("does not throw on missing optional keys", () => {
    expect(env.WORLD_LABS_API_KEY).toBeDefined();
    expect(env.FAL_KEY).toBeDefined();
    expect(env.ELEVENLABS_API_KEY).toBeDefined();
  });
});
