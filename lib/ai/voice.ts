/**
 * ElevenLabs voice adapter — Instant Voice Cloning (IVC) + narration TTS.
 *
 * Real delegates to `lib/image-blaster/sfx.ts` IVC helpers. Mock is in-process
 * and deterministic.
 */
import {
  cloneVoice as elevenCloneVoice,
  deleteVoice as elevenDeleteVoice,
  generateNarration as elevenGenerateNarration,
} from "@/lib/image-blaster/sfx";
import { mockId } from "@/lib/utils";
import type {
  NarrationInput,
  NarrationOutput,
  VoiceAdapter,
  VoiceCloneInput,
  VoiceCloneOutput,
} from "./types";

const IVC_COST_CENTS = 50;
const NARRATION_COST_CENTS_PER_KCHAR = 5;
const FIXTURE_NARRATION = "/fixtures/narration.mp3";

export class MockVoiceAdapter implements VoiceAdapter {
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
    // Fetch the sample (typically already living in Vercel Blob).
    const sampleRes = await fetch(input.sampleUrl);
    if (!sampleRes.ok) {
      throw new Error(`voice sample fetch failed: ${sampleRes.status}`);
    }
    const blob = await sampleRes.blob();
    const { voiceId } = await elevenCloneVoice({
      apiKey: this.apiKey,
      name: input.name,
      description: input.description,
      sampleBytes: blob,
      sampleFilename: "sample.webm",
    });
    return { voiceId, costCents: IVC_COST_CENTS };
  }

  async generateNarration(input: NarrationInput): Promise<NarrationOutput> {
    const buf = await elevenGenerateNarration({
      apiKey: this.apiKey,
      voiceId: input.voiceId,
      text: input.text,
    });
    const b64 = Buffer.from(buf).toString("base64");
    return {
      // Caller should pipe through BlobAdapter and replace with a public URL.
      url: `data:audio/mpeg;base64,${b64}`,
      durationSeconds: Math.ceil(input.text.length / 14),
      costCents: Math.max(
        1,
        Math.ceil((input.text.length / 1000) * NARRATION_COST_CENTS_PER_KCHAR),
      ),
    };
  }

  async deleteVoice(voiceId: string): Promise<void> {
    await elevenDeleteVoice(voiceId, this.apiKey);
  }
}
