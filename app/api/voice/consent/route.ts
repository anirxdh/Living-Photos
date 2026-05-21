/**
 * GET  /api/voice/consent?name=Grandma  → returns the consent draft (nonce + phrase)
 * POST /api/voice/consent               → submit attestation + voice sample, get a clone
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildConsentDraft, ConsentError, createConsentedVoiceClone } from "@/lib/voice/consent";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = (url.searchParams.get("name") ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  return NextResponse.json(buildConsentDraft(name));
}

const SubmitBody = z.object({
  name: z.string().min(1).max(120),
  isSelfVoice: z.boolean(),
  consentArtifactUrl: z.string().url(),
  consentTranscript: z.string().min(10),
  consentNonce: z.string().min(4),
  voiceSampleUrl: z.string().url(),
  sceneId: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = SubmitBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const clone = await createConsentedVoiceClone(parsed.data);
    return NextResponse.json({ voiceClone: clone }, { status: 201 });
  } catch (e) {
    if (e instanceof ConsentError) {
      return NextResponse.json({ error: e.reason, code: "consent_denied" }, { status: 422 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
