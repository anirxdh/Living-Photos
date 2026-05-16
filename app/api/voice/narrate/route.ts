/**
 * POST /api/voice/narrate — Memory Letter.
 *
 * Generates narration MP3 for an already-consented voice clone.
 * Enforces the 3-regeneration cap.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { adapters } from "@/lib/ai/factory";
import { memVoiceClones } from "@/lib/db/memory";
import { incrementRegen } from "@/lib/voice/consent";

export const runtime = "nodejs";

const Body = z.object({
  voiceCloneId: z.string().min(1),
  text: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });

  const clone = memVoiceClones.get(parsed.data.voiceCloneId);
  if (!clone) return NextResponse.json({ error: "voice clone not found" }, { status: 404 });
  if (!clone.consentVerifiedAt) {
    return NextResponse.json({ error: "consent not verified" }, { status: 403 });
  }
  if (clone.revokedAt) {
    return NextResponse.json({ error: "voice clone revoked" }, { status: 403 });
  }
  if (!clone.elevenVoiceId) {
    return NextResponse.json({ error: "voice clone missing eleven id" }, { status: 500 });
  }

  const regen = incrementRegen(clone.id);
  if (!regen.ok) {
    return NextResponse.json(
      { error: "regeneration cap reached", count: regen.count },
      { status: 429 },
    );
  }

  const narration = await adapters().voice.generateNarration({
    voiceId: clone.elevenVoiceId,
    text: parsed.data.text,
    cacheKey: `${clone.elevenVoiceId}:${parsed.data.text}`,
  });
  return NextResponse.json({ narration, regenerationCount: regen.count });
}
