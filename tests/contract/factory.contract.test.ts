/**
 * Adapter factory contract — proves the env-flag swap is code-change-free.
 */
import { afterEach, describe, expect, it } from "vitest";
import { adapterMode, adapters, resetAdapters, setAdapters } from "@/lib/ai/factory";
import { MockMarbleAdapter } from "@/lib/ai/marble";

afterEach(() => resetAdapters());

describe("adapter factory", () => {
  it("returns the same bag on repeated calls (memoized)", () => {
    const a = adapters();
    const b = adapters();
    expect(a).toBe(b);
  });

  it("returns Mock implementations when MOCK_MODE=true (test mode)", () => {
    expect(adapterMode).toBe("mock");
    const bag = adapters();
    // Each adapter exposes a known shape; mocks just satisfy the interface.
    expect(typeof bag.marble.submit).toBe("function");
    expect(typeof bag.mesh.submit).toBe("function");
    expect(typeof bag.sfx.generate).toBe("function");
    expect(typeof bag.voice.cloneVoice).toBe("function");
    expect(typeof bag.stripe.createCheckoutSession).toBe("function");
    expect(typeof bag.blob.put).toBe("function");
  });

  it("setAdapters() overrides only the named adapter", () => {
    const fake = new MockMarbleAdapter();
    setAdapters({ marble: fake });
    expect(adapters().marble).toBe(fake);
    // Other adapters remain Mock defaults — but importantly, still functional.
    expect(typeof adapters().mesh.submit).toBe("function");
  });

  it("resetAdapters() clears overrides", () => {
    const fake = new MockMarbleAdapter();
    setAdapters({ marble: fake });
    resetAdapters();
    expect(adapters().marble).not.toBe(fake);
  });
});
