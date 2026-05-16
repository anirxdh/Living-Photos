import { describe, expect, it } from "vitest";
import { MockSfxAdapter, RealSfxAdapter } from "@/lib/ai/sfx";
import type { SfxAdapter } from "@/lib/ai/types";

const implementations: Array<{ name: string; build: () => SfxAdapter | null }> = [
  { name: "MockSfxAdapter", build: () => new MockSfxAdapter() },
  {
    name: "RealSfxAdapter",
    build: () =>
      process.env.ELEVENLABS_API_KEY ? new RealSfxAdapter(process.env.ELEVENLABS_API_KEY) : null,
  },
];

for (const { name, build } of implementations) {
  describe(`SfxAdapter contract: ${name}`, () => {
    const adapter = build();
    if (!adapter) {
      it.skip(`${name} skipped — set ELEVENLABS_API_KEY to enable`, () => {});
      return;
    }

    it("generate() returns { url, durationSeconds, costCents }", async () => {
      const out = await adapter.generate({
        prompt: "soft warm room ambience",
        durationSeconds: 5,
        cacheKey: `test_${name}`,
      });
      expect(out.url).toBeTypeOf("string");
      expect(out.url.length).toBeGreaterThan(0);
      expect(out.durationSeconds).toBeGreaterThan(0);
      expect(out.costCents).toBeTypeOf("number");
    });

    it("clamps durationSeconds to 22 max", async () => {
      const out = await adapter.generate({
        prompt: "test",
        durationSeconds: 100,
        cacheKey: `clamp_${name}`,
      });
      expect(out.durationSeconds).toBeLessThanOrEqual(22);
    });
  });
}
