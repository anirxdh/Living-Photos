import { NextResponse } from "next/server";
import { getScene, publicScene } from "@/lib/scenes";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scene = getScene(id);
  if (!scene) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Strip owner-only fields. Until auth lands, every fetch is treated as
  // a stranger's read — generated assets are gated on `paid`.
  return NextResponse.json({ scene: publicScene(scene) });
}
