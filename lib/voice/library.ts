/**
 * Curated ElevenLabs library voices — already-published voices in the public
 * ElevenLabs voice library that any account can use for TTS without going
 * through the consent + clone flow. We pre-seed them into the voice_clones
 * table with consentVerifiedAt set so the consent gate at /api/scenes
 * accepts them just like a user-cloned voice.
 *
 * Use case: "quick start" — let a user try the product end-to-end with a
 * realistic-sounding narration without recording their own voice. Especially
 * useful for hackathon judges who don't want to record themselves to evaluate
 * the product.
 *
 * IDs verified against ElevenLabs's public voice library (sourced from the
 * default voice catalog every account ships with). If any ID becomes
 * unavailable on a specific account, the narration call will 404; we surface
 * that as a generic "Saved voice is no longer valid" via the /create error
 * handler.
 */

export interface LibraryVoice {
  /** Internal id used as the voice_clones primary key. Keep stable. */
  id: string;
  /** Upstream ElevenLabs voice id — what gets sent to the TTS endpoint. */
  elevenVoiceId: string;
  /** Display name shown in the picker. */
  name: string;
  /** Short description to help users pick a voice. */
  description: string;
}

export const LIBRARY_VOICES: LibraryVoice[] = [
  {
    id: "vc_lib_rachel",
    elevenVoiceId: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "Warm, calm — like a grandmother reading a bedtime story",
  },
  {
    id: "vc_lib_adam",
    elevenVoiceId: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    description: "Deep, measured — gentle grandfather narrating a memory",
  },
  {
    id: "vc_lib_bella",
    elevenVoiceId: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    description: "Soft, emotive — younger female voice with feeling",
  },
  {
    id: "vc_lib_antoni",
    elevenVoiceId: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    description: "Friendly, conversational — a warm uncle telling a story",
  },
  {
    id: "vc_lib_domi",
    elevenVoiceId: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    description: "Strong, expressive — confident younger voice",
  },
  {
    id: "vc_lib_elli",
    elevenVoiceId: "MF3mGyEYCl7XYWbV9V6O",
    name: "Elli",
    description: "Calm, soothing — gentle reading voice",
  },
];

export function findLibraryVoiceByElevenId(elevenVoiceId: string): LibraryVoice | undefined {
  return LIBRARY_VOICES.find((v) => v.elevenVoiceId === elevenVoiceId);
}
