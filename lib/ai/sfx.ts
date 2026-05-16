/**
 * ElevenLabs SFX adapter — prompt → looping ambient mp3.
 */

import type { SfxAdapter, SfxInput, SfxOutput } from "./types";

const FIXTURE_AMBIENT = "/fixtures/ambient.mp3";
const SFX_COST_CENTS = 3;

export class MockSfxAdapter implements SfxAdapter {
  async generate(input: SfxInput): Promise<SfxOutput> {
    // Mock returns the fixture URL — deterministic by virtue of being a constant.
    // Real adapter would push the generated mp3 to blob storage and return that URL.
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
    const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: { "xi-api-key": this.apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        text: input.prompt,
        duration_seconds: Math.min(input.durationSeconds ?? 10, 22),
        prompt_influence: 0.5,
      }),
    });
    if (!res.ok) throw new Error(`SFX generate failed: ${res.status}`);
    const buf = await res.arrayBuffer();
    // The caller is expected to push this Buffer to blob storage; for now we
    // return a data URL fallback. Real pipeline pipes the body through the
    // BlobAdapter and uses its public URL instead.
    const b64 = Buffer.from(buf).toString("base64");
    return {
      url: `data:audio/mpeg;base64,${b64}`,
      durationSeconds: input.durationSeconds ?? 10,
      costCents: SFX_COST_CENTS,
    };
  }
}
