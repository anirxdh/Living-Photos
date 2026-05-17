/**
 * Mock-friendly blob signed-upload endpoint.
 *
 * GET  /api/blob/upload?pathname=&contentType=  → returns signed PUT URL + publicUrl
 * PUT  /api/blob/upload?pathname=...            → stores bytes in mock store
 *
 * In real mode the client-direct flow uses @vercel/blob; the GET still returns
 * { url, publicUrl } shape so the upload UI doesn't branch.
 */
import { NextResponse } from "next/server";
import { adapters } from "@/lib/ai/factory";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.searchParams.get("pathname");
  const contentType = url.searchParams.get("contentType") ?? "application/octet-stream";
  if (!pathname) return NextResponse.json({ error: "pathname required" }, { status: 400 });
  const signed = await adapters().blob.createSignedUploadUrl({ pathname, contentType });
  return NextResponse.json(signed);
}

export async function PUT(req: Request) {
  // Both mock and real adapters implement put() — mock stashes in-memory,
  // real uploads to Vercel Blob via the @vercel/blob SDK. Same code path.
  const url = new URL(req.url);
  const pathname = url.searchParams.get("pathname");
  if (!pathname) return NextResponse.json({ error: "pathname required" }, { status: 400 });
  const body = await req.arrayBuffer();
  const out = await adapters().blob.put({
    pathname,
    body,
    contentType: req.headers.get("content-type") ?? "application/octet-stream",
  });
  return NextResponse.json(out);
}
