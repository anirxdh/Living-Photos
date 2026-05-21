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
import { env } from "@/lib/env";

export const runtime = "nodejs";

/** Pathname must start with one of these to be allowed. Stops attackers from
 *  using our Blob bucket as anonymous storage / phishing CDN.
 *
 *  `e2e-test/` is appended only in non-production so the test namespace can't
 *  bleed into a live bucket.
 */
const PRODUCTION_PREFIXES = ["uploads/", "voice/", "scenes/"] as const;
const allowedPrefixes = () =>
  env.NODE_ENV === "production"
    ? PRODUCTION_PREFIXES
    : ([...PRODUCTION_PREFIXES, "e2e-test/"] as const);

/** Allowed content types — restricts to media files we actually generate.
 *  In particular keeps HTML/JS/SVG out so the bucket can't host phishing pages
 *  under the deploy's domain reputation. */
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/ogg",
  "video/mp4",
  "video/webm",
]);

/** 50 MB hard cap — photos are ~5 MB compressed, voice clips ~2 MB. */
const MAX_BYTES = 50 * 1024 * 1024;

/** Reject path-traversal, absolute paths, and anything outside the allow-list. */
function validatePathname(
  pathname: string | null,
): { ok: true; pathname: string } | { ok: false; error: string } {
  if (!pathname) return { ok: false, error: "pathname required" };
  if (pathname.length > 256) return { ok: false, error: "pathname too long" };
  if (pathname.includes("..") || pathname.startsWith("/") || pathname.includes("\\")) {
    return { ok: false, error: "invalid pathname" };
  }
  const prefixes = allowedPrefixes();
  if (!prefixes.some((p) => pathname.startsWith(p))) {
    return { ok: false, error: `pathname must start with ${prefixes.join(" | ")}` };
  }
  return { ok: true, pathname };
}

function validateContentType(
  ct: string | null,
): { ok: true; ct: string } | { ok: false; error: string } {
  const normalized = (ct ?? "").split(";")[0].trim().toLowerCase();
  if (!normalized) return { ok: false, error: "content-type required" };
  if (!ALLOWED_CONTENT_TYPES.has(normalized)) {
    return { ok: false, error: `content-type ${normalized} not allowed` };
  }
  return { ok: true, ct: normalized };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const path = validatePathname(url.searchParams.get("pathname"));
  if (!path.ok) return NextResponse.json({ error: path.error }, { status: 400 });
  const ct = validateContentType(url.searchParams.get("contentType"));
  if (!ct.ok) return NextResponse.json({ error: ct.error }, { status: 400 });
  const signed = await adapters().blob.createSignedUploadUrl({
    pathname: path.pathname,
    contentType: ct.ct,
  });
  return NextResponse.json(signed);
}

export async function PUT(req: Request) {
  // Both mock and real adapters implement put() — mock stashes in-memory,
  // real uploads to Vercel Blob via the @vercel/blob SDK. Same code path.
  // Restrictions below stop the endpoint from being used as an unauthenticated
  // anonymous CDN / phishing host (the original PUT had no validation).
  const url = new URL(req.url);
  const path = validatePathname(url.searchParams.get("pathname"));
  if (!path.ok) return NextResponse.json({ error: path.error }, { status: 400 });
  const ct = validateContentType(req.headers.get("content-type"));
  if (!ct.ok) return NextResponse.json({ error: ct.error }, { status: 400 });
  // Require a numeric content-length so we can reject oversized uploads BEFORE
  // buffering the body. Without this, an attacker omitting the header would
  // still hit the post-read check on byteLength, but only after the full body
  // is in memory.
  const rawLen = req.headers.get("content-length");
  const contentLength = rawLen ? Number.parseInt(rawLen, 10) : NaN;
  if (!Number.isFinite(contentLength) || contentLength < 0) {
    return NextResponse.json({ error: "valid content-length required" }, { status: 411 });
  }
  if (contentLength > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (max 50 MB)" }, { status: 413 });
  }
  const body = await req.arrayBuffer();
  // Defence-in-depth — header could lie. Reject if actual body exceeds cap.
  if (body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (max 50 MB)" }, { status: 413 });
  }
  const out = await adapters().blob.put({
    pathname: path.pathname,
    body,
    contentType: ct.ct,
  });
  return NextResponse.json(out);
}
