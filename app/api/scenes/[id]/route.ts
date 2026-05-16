import { NextResponse } from "next/server";
import { getScene } from "@/lib/scenes";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scene = getScene(id);
  if (!scene) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ scene });
}
