/**
 * ElevenLabs SFX adapter — prompt → looping ambient mp3.
 *
 * Real delegates to `lib/image-blaster/sfx.ts` (ported from the open-source
 * image-blaster pipeline — see NOTICE.md for MIT attribution). The MP3 bytes
 * are returned as a base64 data URL today; production callers should pipe the
 * ArrayBuffer through the BlobAdapter and store the public URL on the scene.
 */
import { generateElevenSfx } from "@/lib/image-blaster/sfx";
import type { SfxAdapter, SfxInput, SfxOutput } from "./types";

const FIXTURE_AMBIENT = "/fixtures/ambient.mp3";
const SFX_COST_CENTS = 3;

export class MockSfxAdapter implements SfxAdapter {
  async generate(input: SfxInput): Promise<SfxOutput> {
    return {
      url: FIXTURE_AMBIENT,
      durationSeconds: Math.min(input.durationSeconds ?? 10, 22),
      costCents: SFX_COST_CENTS,
    };
  }
}

export class RealSfxAdapter implements SfxAdapter {
  constructor(private apiKey: string) {
    if (!apiKey) throw new Error("RealSfxAdapter: ELEVENLABS_API_KEY missing");
  }

  async generate(input: SfxInput): Promise<SfxOutput> {
    const buf = await generateElevenSfx({
      apiKey: this.apiKey,
      text: input.prompt,
      durationSeconds: input.durationSeconds ?? 10,
      promptInfluence: 0.5,
    });
    const b64 = Buffer.from(buf).toString("base64");
    return {
      // Pipeline orchestrator should pipe this through BlobAdapter and replace
      // with a stable public URL; data URL is the pure-fallback shape.
      url: `data:audio/mpeg;base64,${b64}`,
      durationSeconds: input.durationSeconds ?? 10,
      costCents: SFX_COST_CENTS,
    };
  }
}
