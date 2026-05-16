import { describe, expect, it } from "vitest";
import { MockMeshAdapter, RealMeshAdapter } from "@/lib/ai/fal";
import type { MeshAdapter } from "@/lib/ai/types";

const implementations: Array<{ name: string; build: () => MeshAdapter | null }> = [
  { name: "MockMeshAdapter", build: () => new MockMeshAdapter() },
  {
    name: "RealMeshAdapter",
    build: () => (process.env.FAL_KEY ? new RealMeshAdapter(process.env.FAL_KEY) : null),
  },
];

for (const { name, build } of implementations) {
  describe(`MeshAdapter contract: ${name}`, () => {
    const adapter = build();
    if (!adapter) {
      it.skip(`${name} skipped — set FAL_KEY to enable`, () => {});
      return;
    }

    it("submit() returns { jobId }", async () => {
      const out = await adapter.submit({
        imageUrl: "https://example.test/x.jpg",
        objectId: `obj_${name}`,
      });
      expect(out.jobId).toBeTypeOf("string");
    });

    it("poll() returns { jobId, status, costCents }", async () => {
      const sub = await adapter.submit({
        imageUrl: "https://example.test/x.jpg",
        objectId: `obj_${name}_2`,
      });
      const res = await adapter.poll(sub.jobId);
      expect(res.jobId).toBe(sub.jobId);
      expect(["pending", "succeeded", "failed"]).toContain(res.status);
      expect(res.costCents).toBeTypeOf("number");
    });
  });
}
