/**
 * Stripe webhook receiver — Node runtime, raw-body signature verification,
 * idempotency via `processed_webhook_events` UNIQUE(provider, event_id).
 *
 * Returns 200 in <1s even for duplicates; mutation is logged but the response
 * is identical so Stripe doesn't retry.
 */
import { NextResponse } from "next/server";
import { adapters } from "@/lib/ai/factory";
import { fulfillCheckoutEvent } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();
  try {
    const evt = adapters().stripe.verifyAndParseWebhook({ rawBody, signature });
    const out = fulfillCheckoutEvent(evt);
    return NextResponse.json({ received: true, mutated: out.mutated, reason: out.reason });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "verify failed" },
      { status: 400 },
    );
  }
}
