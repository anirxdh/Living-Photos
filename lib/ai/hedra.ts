/**
 * Hedra Character-3 adapter — V3 "talking avatars in the photo" pipeline.
 *
 * Not wired into the V1 viewer yet, but the adapter contract lives here so the
 * pipeline + tests can stub it today and the real swap is the same one-line flip
 * as every other adapter.
 */
import { mockId } from "@/lib/utils";

export interface AvatarSubmitInput {
  /** Cropped portrait of the person to animate. */
  portraitUrl: string;
  /** ElevenLabs voice id to drive lip sync. */
  voiceId: string;
  /** Narration text the avatar should speak. */
  text: string;
  /** Stable key for deterministic mock output. */
  cacheKey: string;
}

export interface AvatarResult {
  jobId: string;
  status: "pending" | "succeeded" | "failed";
  /** MP4 / WebM URL of the talking avatar with audio. */
  videoUrl?: string;
  /** Total runtime in seconds. */
  durationSeconds: number;
  costCents: number;
  error?: string;
}

export interface AvatarAdapter {
  submit(input: AvatarSubmitInput): Promise<{ jobId: string }>;
  poll(jobId: string): Promise<AvatarResult>;
}

const FIXTURE_AVATAR = "/fixtures/avatar.mp4";
const AVATAR_COST_CENTS = 30; // ~$0.06/s × 5s avg

export class MockAvatarAdapter implements AvatarAdapter {
  private results = new Map<string, AvatarResult>();

  async submit(input: AvatarSubmitInput): Promise<{ jobId: string }> {
    const jobId = mockId("avatar_job", input.cacheKey);
    this.results.set(jobId, {
      jobId,
      status: "succeeded",
      videoUrl: FIXTURE_AVATAR,
      durationSeconds: Math.max(2, Math.ceil(input.text.length / 18)),
      costCents: AVATAR_COST_CENTS,
    });
    return { jobId };
  }

  async poll(jobId: string): Promise<AvatarResult> {
    return (
      this.results.get(jobId) ?? {
        jobId,
        status: "failed",
        durationSeconds: 0,
        costCents: 0,
        error: "Mock: unknown jobId",
      }
    );
  }
}

export class RealAvatarAdapter implements AvatarAdapter {
  constructor(private apiKey: string) {
    // Lazy: don't throw in the constructor. Avatar generation (Hedra) is an
    // optional step — most scenes don't need it. Throwing here blocks all
    // other adapters from being instantiated when HEDRA_API_KEY isn't set.
    // We throw at the first actual call instead.
  }

  private assertKey() {
    if (!this.apiKey) throw new Error("RealAvatarAdapter: HEDRA_API_KEY missing");
  }

  async submit(input: AvatarSubmitInput): Promise<{ jobId: string }> {
    this.assertKey();
    const res = await fetch("https://api.hedra.com/v1/character-3/generate", {
      method: "POST",
      headers: { "x-api-key": this.apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        portrait_url: input.portraitUrl,
        voice_id: input.voiceId,
        text: input.text,
      }),
    });
    if (!res.ok) throw new Error(`Hedra submit failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { job_id: string };
    return { jobId: json.job_id };
  }

  async poll(jobId: string): Promise<AvatarResult> {
    this.assertKey();
    const res = await fetch(`https://api.hedra.com/v1/character-3/jobs/${jobId}`, {
      headers: { "x-api-key": this.apiKey },
    });
    if (!res.ok) throw new Error(`Hedra poll failed: ${res.status}`);
    const json = (await res.json()) as {
      status: "pending" | "succeeded" | "failed";
      video_url?: string;
      duration_seconds?: number;
      error?: string;
    };
    return {
      jobId,
      status: json.status,
      videoUrl: json.video_url,
      durationSeconds: json.duration_seconds ?? 0,
      costCents: AVATAR_COST_CENTS,
      error: json.error,
    };
  }
}
