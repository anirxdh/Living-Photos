/**
 * Marble adapter contract.
 *
 * Runs against MockMarbleAdapter. If WORLD_LABS_API_KEY is set in the
 * environment, also runs against RealMarbleAdapter. Both must satisfy
 * identical shape expectations — that's what proves the env-flag swap
 * is safe.
 */
import { describe, expect, it } from "vitest";
import { MockMarbleAdapter, RealMarbleAdapter } from "@/lib/ai/marble";
import type { MarbleAdapter } from "@/lib/ai/types";

const implementations: Array<{ name: string; build: () => MarbleAdapter | null }> = [
  { name: "MockMarbleAdapter", build: () => new MockMarbleAdapter() },
  {
    name: "RealMarbleAdapter",
    build: () => {
      const key = process.env.WORLD_LABS_API_KEY;
      if (!key) return null;
      return new RealMarbleAdapter(key);
    },
  },
];

for (const { name, build } of implementations) {
  describe(`MarbleAdapter contract: ${name}`, () => {
    const adapter = build();
    if (!adapter) {
      it.skip(`${name} skipped — set WORLD_LABS_API_KEY to enable`, () => {});
      return;
    }

    it("submit() returns { jobId, estimatedReadyAt }", async () => {
      const out = await adapter.submit({
        imageUrl: "https://example.test/room.jpg",
        sceneId: `scn_contract_${name}`,
      });
      expect(out.jobId).toBeTypeOf("string");
      expect(out.jobId.length).toBeGreaterThan(0);
      expect(new Date(out.estimatedReadyAt).getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    it("poll() returns { jobId, status, costCents }", async () => {
      const sub = await adapter.submit({
        imageUrl: "https://example.test/room.jpg",
        sceneId: `scn_contract_${name}_2`,
      });
      const res = await adapter.poll(sub.jobId);
      expect(res.jobId).toBe(sub.jobId);
      expect(["pending", "succeeded", "failed"]).toContain(res.status);
      expect(res.costCents).toBeTypeOf("number");
    });

    it("submit() is deterministic in mock mode (same sceneId → same jobId)", async () => {
      if (name !== "MockMarbleAdapter") return;
      const a = await adapter.submit({ imageUrl: "u", sceneId: "deterministic_test" });
      const b = await adapter.submit({ imageUrl: "u", sceneId: "deterministic_test" });
      expect(a.jobId).toBe(b.jobId);
    });
  });
}
