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

export const inngest = new Inngest({
  id: "living-photos",
  schemas: new EventSchemas().fromRecord<Events>(),
  // In MOCK_MODE we don't talk to the Inngest cloud — set a dev event key.
  eventKey: env.MOCK_MODE ? "mock-dev-key" : env.INNGEST_EVENT_KEY || undefined,
});

// In MOCK_MODE, swap `send` for a local recorder AND run the matching pipeline
// directly (no Inngest cloud roundtrip). Fire-and-forget so the POST /api/scenes
// response isn't blocked on the ~1 sec mock generation.
if (env.MOCK_MODE) {
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
          .catch(() => {
            /* swallow — scene stays in failed/pending; UI poll surfaces it */
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
