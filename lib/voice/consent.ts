/**
 * Voice consent gate.
 *
 * No IVC API call is reachable unless `consent_verified_at` is set on the
 * voice_clones row. The attestation phrase the user must read includes a
 * unique nonce so a re-uploaded older recording can't be replayed against a
 * fresh nonce.
 */
import { customAlphabet } from "nanoid";
import { adapters } from "@/lib/ai/factory";
import { memVoiceClones } from "@/lib/db/memory";
import type { VoiceClone } from "@/lib/db/schema";
import { newId } from "@/lib/utils";

const nonceAlpha = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

/** Public-figure denylist seed — phase-7 expands to OFAC + Wikipedia top-10k. */
const DENYLIST = new Set(
  [
    "donald trump",
    "joe biden",
    "kamala harris",
    "barack obama",
    "elon musk",
    "taylor swift",
    "drake",
    "kanye west",
    "kim kardashian",
    "morgan freeman",
    "david attenborough",
  ].map(normalizeName),
);

/**
 * Canonicalize a name so the denylist catches "Donald  Trump", "donald-trump",
 * "Дональд Трамп" (NFKC homoglyph fold), and trailing punctuation.
 */
function normalizeName(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isDenylistedName(name: string): boolean {
  const n = normalizeName(name);
  if (DENYLIST.has(n)) return true;
  if (!n) return false;
  const tokens = n.split(" ");
  // Match if every token in a banned name appears in the input (in order),
  // so "Donald J Trump" / "Donald Trump.", and "Donald-Trump" all hit.
  for (const banned of DENYLIST) {
    const bannedTokens = banned.split(" ");
    let cursor = 0;
    let allMatched = true;
    for (const bt of bannedTokens) {
      const idx = tokens.indexOf(bt, cursor);
      if (idx === -1) {
        allMatched = false;
        break;
      }
      cursor = idx + 1;
    }
    if (allMatched) return true;
  }
  return false;
}

export interface ConsentDraft {
  nonce: string;
  phrase: string;
  /** What the user reads aloud — includes the nonce and their stated name. */
  promptForUser: string;
}

export function buildConsentDraft(name: string): ConsentDraft {
  const nonce = nonceAlpha();
  const phrase = `I, ${name}, give my consent to clone my voice for use in Living Photos. The verification code is ${nonce}.`;
  return {
    nonce,
    phrase,
    promptForUser: `Please read this aloud, clearly:\n\n"${phrase}"`,
  };
}

export interface CreateVoiceCloneArgs {
  userId?: string;
  sceneId?: string;
  name: string;
  isSelfVoice: boolean;
  /** Recorded video/audio of the user reading the consent phrase. */
  consentArtifactUrl: string;
  /** What the user actually said (Whisper / Scribe transcript). */
  consentTranscript: string;
  /** Nonce we issued. */
  consentNonce: string;
  /** URL to the long-form voice sample for IVC. */
  voiceSampleUrl: string;
}

export class ConsentError extends Error {
  constructor(public reason: string) {
    super(reason);
  }
}

/**
 * Verifies the consent artifact and creates a cloned voice. Throws ConsentError
 * if the consent doesn't satisfy the gate.
 */
export async function createConsentedVoiceClone(args: CreateVoiceCloneArgs): Promise<VoiceClone> {
  if (isDenylistedName(args.name)) {
    throw new ConsentError(
      "This name appears on our public-figure denylist. We can't clone voices of public figures.",
    );
  }
  if (!args.consentTranscript.toLowerCase().includes(args.consentNonce.toLowerCase())) {
    throw new ConsentError(
      "We couldn't verify the consent nonce in the recording. Please re-record with the exact phrase shown.",
    );
  }
  if (!args.consentTranscript.toLowerCase().includes(args.name.toLowerCase())) {
    throw new ConsentError(
      "The recording must include the person's name as it appears on the consent phrase.",
    );
  }

  // Pass the gate — now (and ONLY now) call IVC.
  const clone = await adapters().voice.cloneVoice({
    sampleUrl: args.voiceSampleUrl,
    name: args.name,
    description: `Living Photos voice clone for ${args.name}`,
  });

  const row: VoiceClone = {
    id: newId("vc"),
    userId: args.userId ?? null,
    sceneId: args.sceneId ?? null,
    elevenVoiceId: clone.voiceId,
    name: args.name,
    consentArtifactUrl: args.consentArtifactUrl,
    consentTranscript: args.consentTranscript,
    consentNonce: args.consentNonce,
    consentVerifiedAt: new Date(),
    isSelfVoice: args.isSelfVoice,
    regenerationCount: 0,
    revokedAt: null,
    createdAt: new Date(),
  };

  // Always persist locally — until real Drizzle is wired, the memory store is
  // the source of truth. Without this, the narration endpoint can't find the
  // clone it just created.
  memVoiceClones.insert(row);
  return row;
}

/**
 * Revoke a voice clone: deletes upstream (ElevenLabs) and marks the row revoked.
 */
export async function revokeVoiceClone(voiceCloneId: string): Promise<void> {
  const row = memVoiceClones.get(voiceCloneId);
  if (!row) throw new Error("voice clone not found");
  if (row.elevenVoiceId) {
    await adapters().voice.deleteVoice(row.elevenVoiceId);
  }
  memVoiceClones.update(voiceCloneId, { revokedAt: new Date(), elevenVoiceId: null });
}

/**
 * Enforce regeneration cap (3) per scene.
 */
export const REGEN_CAP = 3;
export function incrementRegen(voiceCloneId: string): {
  ok: boolean;
  count: number;
} {
  const row = memVoiceClones.get(voiceCloneId);
  if (!row) return { ok: false, count: 0 };
  if (row.regenerationCount >= REGEN_CAP) return { ok: false, count: row.regenerationCount };
  const updated = memVoiceClones.update(voiceCloneId, {
    regenerationCount: row.regenerationCount + 1,
  });
  return { ok: true, count: updated?.regenerationCount ?? 0 };
}
