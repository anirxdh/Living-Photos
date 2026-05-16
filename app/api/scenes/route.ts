/**
 * POST /api/scenes — create a scene from an already-uploaded photo URL and fire
 *                    the Inngest event that kicks off generation.
 *
 * GET  /api/scenes  — list current user's scenes (or all in mock dev).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { inngest } from "@/lib/inngest/client";
import { createScene, listAllScenes, listScenesForOwner } from "@/lib/scenes";

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
  return NextResponse.json({ scene }, { status: 201 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? undefined;
  const userId = url.searchParams.get("userId") ?? undefined;
  if (email || userId) {
    return NextResponse.json({ scenes: listScenesForOwner({ email, userId }) });
  }
  // No filter — return all (mock-only convenience for the dashboard).
  return NextResponse.json({ scenes: listAllScenes() });
}
