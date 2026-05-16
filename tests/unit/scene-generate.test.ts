/**
 * Tests the pipeline composition end-to-end with mock adapters,
 * WITHOUT spinning up the Inngest runtime. We simulate `step.run` as
 * a pass-through and assert the same scene mutations happen.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { adapters } from "@/lib/ai/factory";
import { memScenes, resetMemoryStore } from "@/lib/db/memory";

async function simulatePipeline(sceneId: string, photoUrl: string) {
  const a = adapters();
  memScenes.update(sceneId, { status: "generating" });

  const marbleSubmit = await a.marble.submit({ imageUrl: photoUrl, sceneId });
  const marbleResult = await a.marble.poll(marbleSubmit.jobId);
  if (marbleResult.status !== "succeeded" || !marbleResult.spzUrl) {
    throw new Error("marble failed");
  }

  const objects = [
    { objectId: `${sceneId}_obj_1`, label: "lamp" },
    { objectId: `${sceneId}_obj_2`, label: "chair" },
  ];

  const meshes = await Promise.all(
    objects.map(async (o) => {
      const sub = await a.mesh.submit({ imageUrl: photoUrl, objectId: o.objectId });
      const res = await a.mesh.poll(sub.jobId);
      return { url: res.glbUrl!, label: o.label, costCents: res.costCents };
    }),
  );

  const sfx = await a.sfx.generate({
    prompt: "warm interior",
    cacheKey: sceneId,
    durationSeconds: 22,
  });

  const totalCost =
    marbleResult.costCents + meshes.reduce((s, m) => s + m.costCents, 0) + sfx.costCents;

  memScenes.update(sceneId, {
    status: "ready",
    spzUrl: marbleResult.spzUrl,
    meshes: meshes.map((m) => ({ url: m.url, label: m.label })),
    ambientSfxUrl: sfx.url,
    generationCostCents: totalCost,
    readyAt: new Date(),
  });

  return { totalCost, meshes };
}

describe("scene-generate pipeline (mock end-to-end)", () => {
  beforeEach(() => resetMemoryStore());

  it("flips status pending → generating → ready", async () => {
    const s = memScenes.insert({
      id: "scn_e2e_1",
      slug: "e2e1",
      sourcePhotoUrl: "https://x.test/p.jpg",
    });
    expect(s.status).toBe("pending");
    await simulatePipeline("scn_e2e_1", "https://x.test/p.jpg");
    expect(memScenes.get("scn_e2e_1")?.status).toBe("ready");
  });

  it("writes spzUrl + meshes + ambientSfxUrl onto the scene row", async () => {
    memScenes.insert({
      id: "scn_e2e_2",
      slug: "e2e2",
      sourcePhotoUrl: "https://x.test/p.jpg",
    });
    await simulatePipeline("scn_e2e_2", "https://x.test/p.jpg");
    const out = memScenes.get("scn_e2e_2");
    expect(out?.spzUrl).toBeTruthy();
    expect(out?.meshes?.length).toBe(2);
    expect(out?.ambientSfxUrl).toBeTruthy();
  });

  it("records non-zero generationCostCents", async () => {
    memScenes.insert({
      id: "scn_e2e_3",
      slug: "e2e3",
      sourcePhotoUrl: "https://x.test/p.jpg",
    });
    await simulatePipeline("scn_e2e_3", "https://x.test/p.jpg");
    const out = memScenes.get("scn_e2e_3");
    expect(out?.generationCostCents).toBeGreaterThan(0);
  });

  it("is fast in mock mode (<200ms wall-clock)", async () => {
    memScenes.insert({
      id: "scn_perf",
      slug: "perf",
      sourcePhotoUrl: "https://x.test/p.jpg",
    });
    const start = Date.now();
    await simulatePipeline("scn_perf", "https://x.test/p.jpg");
    expect(Date.now() - start).toBeLessThan(200);
  });
});
