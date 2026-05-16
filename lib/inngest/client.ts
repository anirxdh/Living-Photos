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

const sentEvents: Array<{ name: string; data: unknown }> = [];

export const inngest = new Inngest({
  id: "living-photos",
  schemas: new EventSchemas().fromRecord<Events>(),
  // In MOCK_MODE we don't talk to the Inngest cloud — set a dev event key.
  eventKey: env.MOCK_MODE ? "mock-dev-key" : env.INNGEST_EVENT_KEY || undefined,
});

// In MOCK_MODE, swap `send` for a local recorder so tests don't hit the network.
if (env.MOCK_MODE) {
  const proto = Object.getPrototypeOf(inngest) as { send?: unknown };
  proto.send = async (
    args: { name: string; data: unknown } | Array<{ name: string; data: unknown }>,
  ) => {
    const list = Array.isArray(args) ? args : [args];
    for (const e of list) sentEvents.push({ name: e.name, data: e.data });
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
