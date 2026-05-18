import { EventSchemas, Inngest } from "inngest";
import { env } from "@/lib/env";

type Events = {
  "scene/uploaded": {
    data: {
      sceneId: string;
      photoUrl: string;
    };
  };
  "scene/voice.attached": {
    data: {
      sceneId: string;
      voiceCloneId: string;
      narrationText: string;
    };
  };
  "marble/done": {
    data: { jobId: string };
  };
  "fal/done": {
    data: { jobId: string };
  };
};

// Cross-bundle singleton (RSC vs Node) — see lib/db/memory.ts
const _globals = globalThis as unknown as {
  __livingPhotosSentInngestEvents?: Array<{ name: string; data: unknown }>;
};
if (!_globals.__livingPhotosSentInngestEvents) _globals.__livingPhotosSentInngestEvents = [];
const sentEvents: Array<{ name: string; data: unknown }> = _globals.__livingPhotosSentInngestEvents;

/** True if we should bypass Inngest cloud and run the pipeline locally:
 *  - MOCK_MODE → using mock adapters, no cloud needed
 *  - real mode but no INNGEST_EVENT_KEY → cloud isn't configured; run real
 *    adapters inline so the dev/demo loop works without an Inngest account. */
const useLocalPipeline = env.MOCK_MODE || !env.INNGEST_EVENT_KEY;

export const inngest = new Inngest({
  id: "living-photos",
  schemas: new EventSchemas().fromRecord<Events>(),
  // When using the local pipeline path we still want a string here so the SDK
  // doesn't refuse to construct; the .send override below intercepts before
  // any cloud call happens.
  eventKey: useLocalPipeline ? "local-dev-key" : env.INNGEST_EVENT_KEY,
});

// Local-pipeline path: swap `send` for a recorder + direct invocation of the
// matching pipeline function. Fire-and-forget so POST /api/scenes returns fast.
if (useLocalPipeline) {
  const proto = Object.getPrototypeOf(inngest) as { send?: unknown };
  proto.send = async (
    args: { name: string; data: unknown } | Array<{ name: string; data: unknown }>,
  ) => {
    const list = Array.isArray(args) ? args : [args];
    for (const e of list) {
      sentEvents.push({ name: e.name, data: e.data });
      if (e.name === "scene/uploaded") {
        const data = e.data as { sceneId: string; photoUrl: string };
        // Lazy-import to avoid circular module loading at top level
        import("./mock-pipeline")
          .then((m) => m.runMockScenePipeline(data.sceneId, data.photoUrl))
          .catch((err) => {
            console.error(`[pipeline] ${data.sceneId} crashed:`, err);
          });
      }
    }
    return { ids: list.map((_, i) => `mock_evt_${sentEvents.length + i}`) };
  };
}

/** Test helpers — exported for vitest assertions. */
export function getSentInngestEvents() {
  return [...sentEvents];
}
export function clearSentInngestEvents() {
  sentEvents.length = 0;
}
