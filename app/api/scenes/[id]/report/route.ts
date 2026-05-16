import { NextResponse } from "next/server";
import { z } from "zod";
import { memScenes } from "@/lib/db/memory";
import { newId } from "@/lib/utils";

export const runtime = "nodejs";

const Body = z.object({
  reason: z.string().min(5).max(500),
  reporterEmail: z.string().email().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scene = memScenes.get(id);
  if (!scene) return NextResponse.json({ error: "not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });
  // For mock mode we just append to the scene description as an abuse marker
  // and 1-hour-auto-nuke is enforced by a tiny tag; the real persistence
  // lands when we wire Drizzle in real mode.
  memScenes.update(id, {
    error: `[REPORTED ${new Date().toISOString()}] ${parsed.data.reason}`,
  });
  return NextResponse.json({
    received: true,
    reportId: newId("rpt"),
    autoNukeAtIso: new Date(Date.now() + 60 * 60_000).toISOString(),
  });
}
