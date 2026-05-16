import { EventSchemas, Inngest } from "inngest";

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

export const inngest = new Inngest({
  id: "living-photos",
  schemas: new EventSchemas().fromRecord<Events>(),
});
