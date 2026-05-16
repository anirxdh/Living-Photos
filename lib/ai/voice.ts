/**
 * ElevenLabs voice adapter — Instant Voice Cloning (IVC) + narration TTS.
 *
 * Mock never calls a network. Real wraps the official @elevenlabs/elevenlabs-js
 * SDK (lazy-imported so it's not bundled into edge functions that don't need it).
 */

import { mockId } from "@/lib/utils";
import type {
  NarrationInput,
  NarrationOutput,
  VoiceAdapter,
  VoiceCloneInput,
  VoiceCloneOutput,
} from "./types";

const IVC_COST_CENTS = 50; // hand-tuned estimate
const NARRATION_COST_CENTS_PER_KCHAR = 5;
const FIXTURE_NARRATION = "/fixtures/narration.mp3";

export class MockVoiceAdapter implements VoiceAdapter {
  /** Cache so the same seed returns the same voice id within a test run. */
  private clones = new Map<string, string>();

  async cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneOutput> {
    const key = `${input.name}:${input.sampleUrl}`;
    const cached = this.clones.get(key);
    const voiceId = cached ?? mockId("voice", key);
    this.clones.set(key, voiceId);
    return { voiceId, costCents: IVC_COST_CENTS };
  }

  async generateNarration(input: NarrationInput): Promise<NarrationOutput> {
    const cost = Math.max(
      1,
      Math.ceil((input.text.length / 1000) * NARRATION_COST_CENTS_PER_KCHAR),
    );
    return {
      url: FIXTURE_NARRATION,
      durationSeconds: Math.ceil(input.text.length / 14),
      costCents: cost,
    };
  }

  async deleteVoice(voiceId: string): Promise<void> {
    for (const [k, v] of this.clones) if (v === voiceId) this.clones.delete(k);
  }
}

export class RealVoiceAdapter implements VoiceAdapter {
  constructor(private apiKey: string) {
    if (!apiKey) throw new Error("RealVoiceAdapter: ELEVENLABS_API_KEY missing");
  }

  async cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneOutput> {
    const sampleRes = await fetch(input.sampleUrl);
    if (!sampleRes.ok) throw new Error(`voice sample fetch failed: ${sampleRes.status}`);
    const blob = await sampleRes.blob();
    const form = new FormData();
    form.append("name", input.name);
    form.append("description", input.description ?? "");
    form.append("files", blob, "sample.wav");
    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": this.apiKey },
      body: form,
    });
    if (!res.ok) throw new Error(`IVC failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { voice_id: string };
    return { voiceId: json.voice_id, costCents: IVC_COST_CENTS };
  }

  async generateNarration(input: NarrationInput): Promise<NarrationOutput> {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(input.voiceId)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "content-type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: input.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );
    if (!res.ok) throw new Error(`Narration failed: ${res.status}`);
    const buf = await res.arrayBuffer();
    // The caller is expected to persist via BlobAdapter; we return a base64 data URL
    // for tests and dev. Production pipeline overrides this with a blob URL.
    const b64 = Buffer.from(buf).toString("base64");
    return {
      url: `data:audio/mpeg;base64,${b64}`,
      durationSeconds: Math.ceil(input.text.length / 14),
      costCents: Math.max(
        1,
        Math.ceil((input.text.length / 1000) * NARRATION_COST_CENTS_PER_KCHAR),
      ),
    };
  }

  async deleteVoice(voiceId: string): Promise<void> {
    const res = await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}`, {
      method: "DELETE",
      headers: { "xi-api-key": this.apiKey },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Voice delete failed: ${res.status}`);
    }
  }
}
