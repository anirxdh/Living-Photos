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

/** Poll a job-status function until it returns non-"pending" or times out.
 *  Mock adapters resolve on first call (zero waiting); real adapters spend
 *  3–5 min on Marble, ~30s–1min on FAL Hunyuan3D. */
async function pollUntilDone<T extends { status: string; error?: string }>(
  fn: () => Promise<T>,
  opts: { intervalMs: number; timeoutMs: number },
): Promise<T> {
  const deadline = Date.now() + opts.timeoutMs;
  for (;;) {
    const result = await fn();
    if (result.status !== "pending") return result;
    if (Date.now() >= deadline) {
      return { ...result, status: "failed", error: "timeout" } as T;
    }
    await new Promise((r) => setTimeout(r, opts.intervalMs));
  }
}

export async function runMockScenePipeline(sceneId: string, photoUrl: string): Promise<void> {
  const scene = memScenes.get(sceneId);
  if (!scene) return;
  const a = adapters();
  memScenes.update(sceneId, { status: "generating" });
  console.log(`[pipeline] ${sceneId} starting — photo: ${photoUrl}`);

  try {
    // Idempotency: if scene already has a marble jobId stashed in `error`
    // (we squat there to avoid a schema migration for the demo), resume polling
    // that job instead of submitting a new one. Prevents double-billing on
    // dev-server restart mid-pipeline.
    const existingJob = scene.error?.startsWith("marble:job:")
      ? scene.error.slice("marble:job:".length)
      : null;
    let marbleJobId: string;
    if (existingJob) {
      console.log(`[pipeline] ${sceneId} resuming existing Marble job ${existingJob}`);
      marbleJobId = existingJob;
    } else {
      console.log(`[pipeline] ${sceneId} submitting to Marble…`);
      const marbleSubmit = await a.marble.submit({ imageUrl: photoUrl, sceneId });
      marbleJobId = marbleSubmit.jobId;
      // Persist the jobId immediately so we can resume if anything restarts
      // before completion. Cost is paid on submit; never want to submit twice.
      memScenes.update(sceneId, { error: `marble:job:${marbleJobId}` });
      console.log(`[pipeline] ${sceneId} marble job ${marbleJobId} — polling`);
    }
    // Real Marble takes 3–5 min; poll every 5s up to 10 min.
    const marbleResult = await pollUntilDone(() => a.marble.poll(marbleJobId), {
      intervalMs: 5_000,
      timeoutMs: 10 * 60_000,
    });
    console.log(`[pipeline] ${sceneId} marble done: ${marbleResult.status}`);
    if (marbleResult.status !== "succeeded" || !marbleResult.spzUrl) {
      memScenes.update(sceneId, {
        status: "failed",
        error: marbleResult.error ?? `marble returned ${marbleResult.status}`,
      });
      console.error(`[pipeline] ${sceneId} marble failed: ${marbleResult.error}`);
      return;
    }

    const objects = [
      { objectId: `${sceneId}_obj_1`, label: "lamp" },
      { objectId: `${sceneId}_obj_2`, label: "chair" },
    ];

    console.log(`[pipeline] ${sceneId} submitting ${objects.length} FAL Hunyuan3D meshes…`);
    const meshes = await Promise.all(
      objects.map(async (o) => {
        const sub = await a.mesh.submit({ imageUrl: photoUrl, objectId: o.objectId });
        // FAL Hunyuan3D ~30s–1min; poll every 3s up to 5 min.
        const res = await pollUntilDone(() => a.mesh.poll(sub.jobId), {
          intervalMs: 3_000,
          timeoutMs: 5 * 60_000,
        });
        return { url: res.glbUrl ?? "", label: o.label, costCents: res.costCents };
      }),
    );
    console.log(`[pipeline] ${sceneId} ${meshes.length} meshes done`);

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
    console.log(`[pipeline] ${sceneId} ✅ ready — total cost: $${(totalCost / 100).toFixed(2)}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    memScenes.update(sceneId, { status: "failed", error: msg });
    console.error(`[pipeline] ${sceneId} ❌ failed: ${msg}`);
  }
}
