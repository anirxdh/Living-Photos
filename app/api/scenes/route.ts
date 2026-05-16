/**
 * POST /api/scenes — create a scene from an already-uploaded photo URL and fire
 *                    the Inngest event that kicks off generation.
 *
 * GET  /api/scenes  — list current user's scenes (or all in mock dev).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { inngest } from "@/lib/inngest/client";
import { createScene, listScenesForOwner, publicScene } from "@/lib/scenes";

export const runtime = "nodejs";

const CreateBody = z.object({
  sourcePhotoUrl: z.string().url(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  anonymousEmail: z.string().email().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const scene = createScene(parsed.data);
  await inngest.send({
    name: "scene/uploaded",
    data: { sceneId: scene.id, photoUrl: scene.sourcePhotoUrl },
  });
  // Return the FULL scene object to the creator (they need their own id +
  // assets). All other readers go through GET /api/scenes/[id] which strips.
  return NextResponse.json({ scene }, { status: 201 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? undefined;
  const userId = url.searchParams.get("userId") ?? undefined;
  // Refuse unfiltered listing — every caller must scope to their own scenes.
  // (Auth-gating lands when Clerk wires up; until then `email` is best-effort.)
  if (!email && !userId) {
    return NextResponse.json(
      { error: "userId or email query parameter required" },
      { status: 400 },
    );
  }
  const scenes = listScenesForOwner({ email, userId }).map(publicScene);
  return NextResponse.json({ scenes });
}
