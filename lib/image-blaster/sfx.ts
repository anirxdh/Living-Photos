/**
 * ElevenLabs direct API — Sound Effects + Instant Voice Cloning + TTS.
 *
 * Hits the ElevenLabs REST API directly (no SDK weight). Returns raw MP3
 * bytes; callers are expected to push them through the BlobAdapter and store
 * the resulting public URL on the scene row.
 *
 * The FAL proxy at `fal-ai/elevenlabs/sound-effects/v2` is the alternative
 * SFX path (see `lib/image-blaster/fal.ts`); this module is preferred when
 * you already hold an ElevenLabs key.
 */

const ELEVEN_BASE = "https://api.elevenlabs.io/v1";

export interface ElevenSfxArgs {
  text: string;
  /** Seconds; ElevenLabs clamps to [1, 22]. */
  durationSeconds?: number;
  promptInfluence?: number;
  apiKey: string;
}

/** Returns raw MP3 bytes. Caller is responsible for storing them. */
export async function generateElevenSfx(args: ElevenSfxArgs): Promise<ArrayBuffer> {
  if (!args.apiKey) throw new Error("ElevenLabs: ELEVENLABS_API_KEY missing.");
  const res = await fetch(`${ELEVEN_BASE}/sound-generation`, {
    method: "POST",
    headers: {
      "xi-api-key": args.apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: args.text,
      duration_seconds: Math.min(Math.max(args.durationSeconds ?? 10, 1), 22),
      prompt_influence: args.promptInfluence ?? 0.5,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`ElevenLabs SFX failed (${res.status}): ${err}`);
  }
  return res.arrayBuffer();
}

// --- IVC + Narration (used by lib/ai/voice.ts) -----------------------------

export interface IvcArgs {
  name: string;
  description?: string;
  /** Audio bytes — wav/mp3/m4a are all accepted. */
  sampleBytes: ArrayBuffer | Blob;
  sampleFilename?: string;
  apiKey: string;
}

export async function cloneVoice(args: IvcArgs): Promise<{ voiceId: string }> {
  if (!args.apiKey) throw new Error("ElevenLabs: ELEVENLABS_API_KEY missing.");
  const form = new FormData();
  form.append("name", args.name);
  if (args.description) form.append("description", args.description);
  const blob =
    args.sampleBytes instanceof Blob
      ? args.sampleBytes
      : new Blob([args.sampleBytes], { type: "audio/mpeg" });
  form.append("files", blob, args.sampleFilename ?? "sample.mp3");

  const res = await fetch(`${ELEVEN_BASE}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": args.apiKey },
    body: form,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`IVC failed (${res.status}): ${err}`);
  }
  const json = (await res.json()) as { voice_id: string };
  if (!json.voice_id) throw new Error("IVC: response missing voice_id.");
  return { voiceId: json.voice_id };
}

export interface NarrateArgs {
  voiceId: string;
  text: string;
  /**
   * Model id. Defaults to `eleven_v3` — released March 2026, most expressive
   * TTS model in the line. Supports inline audio tags like `[whispers]`,
   * `[warm]`, `[sighs]` which the caller can embed directly in `text` for
   * memorial-grade narration.
   */
  modelId?: string;
  apiKey: string;
}

export async function generateNarration(args: NarrateArgs): Promise<ArrayBuffer> {
  const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${encodeURIComponent(args.voiceId)}`, {
    method: "POST",
    headers: {
      "xi-api-key": args.apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: args.text,
      model_id: args.modelId ?? "eleven_v3",
      // Slightly higher similarity_boost for memorial use — we want the clone
      // to feel like *them*, not a generic synthesized read.
      voice_settings: { stability: 0.55, similarity_boost: 0.85, style: 0.3 },
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`ElevenLabs narration failed (${res.status}): ${err}`);
  }
  return res.arrayBuffer();
}

export async function deleteVoice(voiceId: string, apiKey: string): Promise<void> {
  const res = await fetch(`${ELEVEN_BASE}/voices/${encodeURIComponent(voiceId)}`, {
    method: "DELETE",
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`ElevenLabs voice delete failed (${res.status}).`);
  }
}
