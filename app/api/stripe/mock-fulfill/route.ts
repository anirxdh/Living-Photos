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
import { newId } from "@/lib/utils";

export const runtime = "nodejs";

const Body = z.object({ sceneId: z.string().min(1), sessionId: z.string().min(1) });

export async function POST(req: Request) {
  if (!env.MOCK_MODE) {
    return NextResponse.json({ error: "mock-mode only" }, { status: 400 });
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
        amount_total: 1900,
        currency: "usd",
      },
    },
  });
  const sig = signMockWebhook(eventBody);
  // Round-trip through verify so we exercise the same code path as real webhooks.
  const evt = adapters().stripe.verifyAndParseWebhook({ rawBody: eventBody, signature: sig });
  const out = fulfillCheckoutEvent(evt);
  void newId; // keep import warm
  return NextResponse.json({ mutated: out.mutated, reason: out.reason });
}
