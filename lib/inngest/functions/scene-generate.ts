/**
 * scene-generate — the heart of Living Photos.
 *
 * Pipeline (each step retryable, observable, and webhook-resumable):
 *   1. submit-marble       — image → World Labs Marble job
 *   2. wait-marble         — poll/wait for splat URL + cost
 *   3. detect-objects      — extract object crops from source photo
 *   4. mesh-objects        — parallel Hunyuan3D per object
 *   5. generate-sfx        — ambient sound from scene description
 *   6. generate-narration  — optional, only if voiceCloneId is set
 *   7. publish             — flip scene to "ready", emit ready event
 *
 * MOCK_MODE finishes in <5 seconds total because every adapter returns
 * immediately. Real mode runs in ~4-5 minutes.
 */

import { adapters } from "@/lib/ai/factory";
import { memScenes } from "@/lib/db/memory";
import { env } from "@/lib/env";
import { inngest } from "../client";

export const sceneGenerate = inngest.createFunction(
  {
    id: "scene-generate",
    name: "Generate a Living Photo scene",
    retries: 3,
  },
  { event: "scene/uploaded" },
  async ({ event, step }) => {
    const { sceneId, photoUrl } = event.data;
    const a = adapters();

    // Mark scene as generating (mock mode uses in-memory store).
    if (env.MOCK_MODE) memScenes.update(sceneId, { status: "generating" });

    // --- 1. Marble submit ----------------------------------------------------
    const marbleSubmit = await step.run("submit-marble", async () => {
      return a.marble.submit({ imageUrl: photoUrl, sceneId });
    });

    // --- 2. Wait for Marble --------------------------------------------------
    const marbleResult = await step.run("wait-marble", async () => {
      // In real mode we'd `step.waitForEvent("marble/done", ...)`. In mock mode
      // the submit already returned a finished result so we poll once.
      return a.marble.poll(marbleSubmit.jobId);
    });
    if (marbleResult.status !== "succeeded" || !marbleResult.spzUrl) {
      throw new Error(`Marble failed: ${marbleResult.error ?? "unknown"}`);
    }

    // --- 3. Detect objects (mock: returns 2 stable crops) -------------------
    const objects = await step.run("detect-objects", async () => {
      // In real mode this would call a SAM-2 / YOLO detector. Mock returns a
      // small fixture set so the mesh step has something to iterate.
      return [
        { objectId: `${sceneId}_obj_1`, label: "lamp" },
        { objectId: `${sceneId}_obj_2`, label: "chair" },
      ];
    });

    // --- 4. Mesh each object (parallel) -------------------------------------
    const meshes = await Promise.all(
      objects.map((o) =>
        step.run(`mesh-${o.objectId}`, async () => {
          const submit = await a.mesh.submit({
            imageUrl: photoUrl,
            objectId: o.objectId,
          });
          const result = await a.mesh.poll(submit.jobId);
          if (result.status !== "succeeded" || !result.glbUrl) {
            throw new Error(`Mesh failed for ${o.objectId}: ${result.error}`);
          }
          return { url: result.glbUrl, label: o.label, costCents: result.costCents };
        }),
      ),
    );

    // --- 5. Ambient SFX -----------------------------------------------------
    const sfx = await step.run("generate-sfx", async () => {
      return a.sfx.generate({
        prompt: "soft warm interior room ambience, distant traffic, gentle wind",
        durationSeconds: 22,
        cacheKey: sceneId,
      });
    });

    // --- 6. Optional narration ----------------------------------------------
    const scene = env.MOCK_MODE ? memScenes.get(sceneId) : null;
    let narrationUrl: string | undefined;
    let narrationCost = 0;
    if (scene?.voiceCloneId) {
      const narration = await step.run("generate-narration", async () => {
        return a.voice.generateNarration({
          voiceId: scene.voiceCloneId!,
          text: scene.description ?? "Welcome home, sweetheart.",
          cacheKey: `${scene.voiceCloneId}:${scene.description ?? ""}`,
        });
      });
      narrationUrl = narration.url;
      narrationCost = narration.costCents;
    }

    // --- 7. Publish ---------------------------------------------------------
    const totalCost =
      marbleResult.costCents +
      meshes.reduce((s, m) => s + m.costCents, 0) +
      sfx.costCents +
      narrationCost;

    await step.run("publish", async () => {
      if (env.MOCK_MODE) {
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
      }
    });

    return {
      sceneId,
      spzUrl: marbleResult.spzUrl,
      meshes,
      ambientSfxUrl: sfx.url,
      narrationUrl,
      totalCostCents: totalCost,
    };
  },
);
