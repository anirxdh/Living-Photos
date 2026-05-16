/**
 * Mock-mode pipeline runner.
 *
 * In real mode, `inngest.send({ name: "scene/uploaded", ... })` ships the
 * event to Inngest cloud which then invokes our `sceneGenerate` step function.
 * In mock mode there's no cloud, so we run an equivalent sequence directly
 * against the in-memory store. Same adapters, same outputs — just no retries
 * or step-level orchestration.
 */
import { adapters } from "@/lib/ai/factory";
import { memScenes } from "@/lib/db/memory";

export async function runMockScenePipeline(sceneId: string, photoUrl: string): Promise<void> {
  const scene = memScenes.get(sceneId);
  if (!scene) return;
  const a = adapters();
  memScenes.update(sceneId, { status: "generating" });

  try {
    const marbleSubmit = await a.marble.submit({ imageUrl: photoUrl, sceneId });
    const marbleResult = await a.marble.poll(marbleSubmit.jobId);
    if (marbleResult.status !== "succeeded" || !marbleResult.spzUrl) {
      memScenes.update(sceneId, { status: "failed", error: marbleResult.error ?? "marble" });
      return;
    }

    const objects = [
      { objectId: `${sceneId}_obj_1`, label: "lamp" },
      { objectId: `${sceneId}_obj_2`, label: "chair" },
    ];

    const meshes = await Promise.all(
      objects.map(async (o) => {
        const sub = await a.mesh.submit({ imageUrl: photoUrl, objectId: o.objectId });
        const res = await a.mesh.poll(sub.jobId);
        return { url: res.glbUrl ?? "", label: o.label, costCents: res.costCents };
      }),
    );

    const sfx = await a.sfx.generate({
      prompt: "soft warm interior room ambience, distant traffic, gentle wind",
      durationSeconds: 22,
      cacheKey: sceneId,
    });

    let narrationUrl: string | undefined;
    let narrationCost = 0;
    const sceneNow = memScenes.get(sceneId);
    if (sceneNow?.voiceCloneId) {
      const narration = await a.voice.generateNarration({
        voiceId: sceneNow.voiceCloneId,
        text: sceneNow.description ?? "Welcome home, sweetheart.",
        cacheKey: `${sceneNow.voiceCloneId}:${sceneNow.description ?? ""}`,
      });
      narrationUrl = narration.url;
      narrationCost = narration.costCents;
    }

    const totalCost =
      marbleResult.costCents +
      meshes.reduce((s, m) => s + m.costCents, 0) +
      sfx.costCents +
      narrationCost;

    memScenes.update(sceneId, {
      status: "ready",
      spzUrl: marbleResult.spzUrl ?? null,
      spzUrlLowPoly: marbleResult.spzUrlLowPoly ?? null,
      meshes: meshes.map((m) => ({ url: m.url, label: m.label })),
      ambientSfxUrl: sfx.url,
      narrationUrl: narrationUrl ?? null,
      generationCostCents: totalCost,
      readyAt: new Date(),
    });
  } catch (e) {
    memScenes.update(sceneId, {
      status: "failed",
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}
