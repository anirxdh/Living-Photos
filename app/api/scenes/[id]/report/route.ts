import { NextResponse } from "next/server";
import { z } from "zod";
import { memReports, memScenes } from "@/lib/db/memory";
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

  // Best-effort per-IP rate limit so a single client can't mass-flag.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (memReports.isRateLimited(ip)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });

  const report = memReports.insert({
    id: newId("rpt"),
    sceneId: id,
    reason: parsed.data.reason,
    reporterEmail: parsed.data.reporterEmail ?? null,
    createdAt: new Date(),
  });

  return NextResponse.json({
    received: true,
    reportId: report.id,
    // Operational policy: triage within 1 hour; the auto-nuke job lands
    // when we wire a scheduled Inngest function in the real swap.
    triageWithinIso: new Date(Date.now() + 60 * 60_000).toISOString(),
  });
}
