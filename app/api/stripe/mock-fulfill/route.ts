/**
 * Mock-mode-only convenience: simulate the Stripe webhook firing for a session.
 * The Checkout success redirect calls this so the demo flow doesn't require
 * `stripe-cli listen` running.
 *
 * In real mode this endpoint refuses; the real webhook does the fulfillment.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { adapters } from "@/lib/ai/factory";
import { signMockWebhook } from "@/lib/ai/stripe";
import { env } from "@/lib/env";
import { fulfillCheckoutEvent } from "@/lib/payments";
import { PRICE_CENTS } from "@/lib/pricing";

export const runtime = "nodejs";

const Body = z.object({ sceneId: z.string().min(1), sessionId: z.string().min(1) });

export async function POST(req: Request) {
  // Double-gate: must be MOCK_MODE AND never reachable in prod (defence in depth
  // against an env-flag misconfiguration leaking the payment bypass to prod).
  if (!env.MOCK_MODE || env.NODE_ENV === "production") {
    return NextResponse.json({ error: "mock-mode only" }, { status: 400 });
  }
  // When real Stripe is force-enabled inside MOCK_MODE (STRIPE_FORCE_REAL=true),
  // the success-page fetch is redundant — the live Stripe webhook already does
  // the fulfillment. Skip silently with 200 so the client doesn't log a 500.
  if (env.STRIPE_FORCE_REAL) {
    return NextResponse.json({ skipped: true, reason: "real Stripe webhook fulfills" });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });

  // Build a deterministic event id from the session id so replays remain idempotent.
  const eventBody = JSON.stringify({
    id: `evt_mock_${parsed.data.sessionId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: parsed.data.sessionId,
        metadata: { sceneId: parsed.data.sceneId },
        amount_total: PRICE_CENTS,
        currency: "usd",
      },
    },
  });
  const sig = signMockWebhook(eventBody);
  // Round-trip through verify so we exercise the same code path as real webhooks.
  const evt = adapters().stripe.verifyAndParseWebhook({ rawBody: eventBody, signature: sig });
  const out = fulfillCheckoutEvent(evt);
  return NextResponse.json({ mutated: out.mutated, reason: out.reason });
}
