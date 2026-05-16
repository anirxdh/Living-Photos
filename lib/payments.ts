/**
 * Payments service — Checkout creation + webhook fulfillment.
 *
 * Idempotency floor: every webhook event is recorded in
 * `processed_webhook_events` with UNIQUE(provider, event_id). If the same
 * event comes in twice, only the first call mutates state.
 */
import { adapters } from "@/lib/ai/factory";
import { memPayments, memProcessed } from "@/lib/db/memory";
import { env } from "@/lib/env";
import { getScene, markScenePaid } from "@/lib/scenes";
import { newId } from "@/lib/utils";

export const PRICE_CENTS = 1900;

interface CheckoutArgs {
  sceneId: string;
  userEmail?: string;
}

export async function startCheckout({ sceneId, userEmail }: CheckoutArgs) {
  const scene = getScene(sceneId);
  if (!scene) throw new Error("scene not found");
  if (scene.paid) {
    return { alreadyPaid: true as const, sceneId };
  }
  const a = adapters();
  const session = await a.stripe.createCheckoutSession({
    sceneId,
    amountCents: PRICE_CENTS,
    currency: "usd",
    successUrl: `${env.NEXT_PUBLIC_APP_URL}/scene/${scene.slug}/success`,
    cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/scene/${scene.slug}`,
    customerEmail: userEmail,
    productName: `Living Photo: ${scene.title}`,
  });
  memPayments.insert({
    id: newId("pay"),
    sceneId,
    stripeCheckoutSessionId: session.sessionId,
    stripePaymentIntentId: null,
    amountCents: PRICE_CENTS,
    currency: "usd",
    email: userEmail ?? null,
    status: "pending",
    createdAt: new Date(),
    completedAt: null,
  });
  return { alreadyPaid: false as const, url: session.url, sessionId: session.sessionId };
}

interface FulfillResult {
  mutated: boolean;
  sceneId?: string;
  reason?: string;
}

/**
 * Apply a verified Stripe webhook event. Idempotent — second call is a no-op.
 */
export function fulfillCheckoutEvent(evt: {
  id: string;
  type: string;
  data: { object: { id: string; metadata?: Record<string, string>; amount_total?: number } };
}): FulfillResult {
  const first = memProcessed.markProcessed({
    id: newId("proc"),
    provider: "stripe",
    eventId: evt.id,
    eventType: evt.type,
    payload: evt,
    processedAt: new Date(),
  });
  if (!first) return { mutated: false, reason: "duplicate" };
  if (evt.type !== "checkout.session.completed") {
    return { mutated: false, reason: "irrelevant_event_type" };
  }
  const sceneId = evt.data.object.metadata?.sceneId;
  if (!sceneId) return { mutated: false, reason: "missing_sceneId_metadata" };
  const scene = getScene(sceneId);
  if (!scene) return { mutated: false, reason: "scene_not_found" };
  markScenePaid(sceneId, evt.data.object.amount_total ?? PRICE_CENTS);
  return { mutated: true, sceneId };
}
