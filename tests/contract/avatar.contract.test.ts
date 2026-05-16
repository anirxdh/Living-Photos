import { describe, expect, it } from "vitest";
import { type AvatarAdapter, MockAvatarAdapter, RealAvatarAdapter } from "@/lib/ai/hedra";

const implementations: Array<{ name: string; build: () => AvatarAdapter | null }> = [
  { name: "MockAvatarAdapter", build: () => new MockAvatarAdapter() },
  {
    name: "RealAvatarAdapter",
    build: () =>
      process.env.HEDRA_API_KEY ? new RealAvatarAdapter(process.env.HEDRA_API_KEY) : null,
  },
];

for (const { name, build } of implementations) {
  describe(`AvatarAdapter contract: ${name}`, () => {
    const adapter = build();
    if (!adapter) {
      it.skip(`${name} skipped — set HEDRA_API_KEY to enable`, () => {});
      return;
    }

    it("submit() returns { jobId }", async () => {
      const out = await adapter.submit({
        portraitUrl: "https://example.test/face.jpg",
        voiceId: "voice_x",
        text: "Hello, sweetheart.",
        cacheKey: `c_${name}`,
      });
      expect(out.jobId).toBeTypeOf("string");
    });

    it("poll() returns the avatar result shape", async () => {
      const sub = await adapter.submit({
        portraitUrl: "https://example.test/face.jpg",
        voiceId: "voice_x",
        text: "Welcome home.",
        cacheKey: `p_${name}`,
      });
      const res = await adapter.poll(sub.jobId);
      expect(res.jobId).toBe(sub.jobId);
      expect(["pending", "succeeded", "failed"]).toContain(res.status);
      expect(res.costCents).toBeTypeOf("number");
      expect(res.durationSeconds).toBeTypeOf("number");
    });
  });
}
