/**
 * Dev-only: lightweight admin actions on the in-memory scene store.
 *
 *   GET    /api/debug/scenes            → list everything (for triage)
 *   PATCH  /api/debug/scenes?id=scn_xxx body: { title?: string }
 *   DELETE /api/debug/scenes?id=scn_xxx
 */
import { NextResponse } from "next/server";
import { memScenes } from "@/lib/db/memory";
import { env } from "@/lib/env";

export const runtime = "nodejs";

function guard() {
  if (env.NODE_ENV === "production") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;
  return NextResponse.json({
    scenes: memScenes.list().map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      status: s.status,
      paid: s.paid,
    })),
  });
}

export async function PATCH(req: Request) {
  const blocked = guard();
  if (blocked) return blocked;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    sourcePhotoUrl?: string;
    description?: string;
  };
  const updated = memScenes.update(id, body);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    scene: {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      sourcePhotoUrl: updated.sourcePhotoUrl,
    },
  });
}

export async function DELETE(req: Request) {
  const blocked = guard();
  if (blocked) return blocked;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // memScenes doesn't expose a delete method; reach into the underlying Map
  // via the globalThis singleton.
  const before = memScenes.list().length;
  const store = (
    globalThis as unknown as { __livingPhotosStore?: { scenes?: Map<string, unknown> } }
  ).__livingPhotosStore;
  store?.scenes?.delete(id);
  const after = memScenes.list().length;
  return NextResponse.json({ deleted: before - after === 1, before, after });
}
