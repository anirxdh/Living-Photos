/**
 * Dev-only: instantly unlock a scene without going through Stripe webhook.
 *
 * Built for video-recording demos where the user is running real Stripe
 * Checkout (so MOCK_MODE=false) but doesn't have `stripe listen` forwarding
 * webhooks to localhost. After Stripe Checkout completes, the success page
 * calls this endpoint to mark the scene as paid so the viewer flow continues.
 *
 *   POST /api/debug/demo-fulfill
 *   body: { sceneId: "scn_xxx" }
 *
 * Refuses in production. The real Stripe webhook handles fulfillment there.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { memScenes } from "@/lib/db/memory";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const Body = z.object({ sceneId: z.string().min(1) });

export async function POST(req: Request) {
  if (env.NODE_ENV === "production") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  const { sceneId } = parsed.data;

  const existing = memScenes.get(sceneId);
  if (!existing) {
    return NextResponse.json({ error: "scene not found" }, { status: 404 });
  }
  if (existing.paid) {
    return NextResponse.json({ alreadyPaid: true, sceneId });
  }

  const updated = memScenes.update(sceneId, {
    paid: true,
    pricePaidCents: 0, // demo unlock — no real charge tracked
    paidAt: new Date(),
  });

  return NextResponse.json({
    fulfilled: true,
    sceneId: updated?.id,
    slug: updated?.slug,
  });
}
