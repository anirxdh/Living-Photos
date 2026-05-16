/**
 * Stripe adapter — Checkout sessions + webhook signature verification.
 *
 * Mock implements an HMAC-based signature scheme matching Stripe's format
 * (t=...,v1=...) so webhook idempotency tests can exercise the full path
 * without network access.
 */
import crypto from "node:crypto";
import Stripe from "stripe";
import { newId } from "@/lib/utils";
import type {
  CheckoutInput,
  CheckoutOutput,
  StripeAdapter,
  StripeWebhookEvent,
  StripeWebhookVerifyInput,
} from "./types";

export const MOCK_WEBHOOK_SECRET = "whsec_mock_secret";

export class MockStripeAdapter implements StripeAdapter {
  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutOutput> {
    const id = `cs_test_${newId("mock").slice(5)}`;
    const params = new URLSearchParams({
      session_id: id,
      scene_id: input.sceneId,
      amount: String(input.amountCents),
    });
    return {
      sessionId: id,
      url: `${input.successUrl}?${params.toString()}`,
    };
  }

  verifyAndParseWebhook(input: StripeWebhookVerifyInput): StripeWebhookEvent {
    const parts = Object.fromEntries(
      input.signature.split(",").map((p) => {
        const [k, v] = p.split("=");
        return [k, v];
      }),
    );
    const t = parts.t;
    const v1 = parts.v1;
    if (!t || !v1) throw new Error("Invalid signature header");
    const expected = crypto
      .createHmac("sha256", MOCK_WEBHOOK_SECRET)
      .update(`${t}.${input.rawBody}`)
      .digest("hex");
    if (
      expected.length !== v1.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
    ) {
      throw new Error("Signature mismatch");
    }
    return JSON.parse(input.rawBody) as StripeWebhookEvent;
  }
}

export class RealStripeAdapter implements StripeAdapter {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    if (!secretKey) throw new Error("RealStripeAdapter: STRIPE_SECRET_KEY missing");
    // biome-ignore lint/suspicious/noExplicitAny: Stripe SDK apiVersion type lags the latest pinned date
    this.stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" as any });
    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutOutput> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency,
            unit_amount: input.amountCents,
            product_data: { name: input.productName },
          },
        },
      ],
      success_url: `${input.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      metadata: {
        sceneId: input.sceneId,
        userId: input.userId ?? "",
      },
    });
    return { sessionId: session.id, url: session.url ?? "" };
  }

  verifyAndParseWebhook(input: StripeWebhookVerifyInput): StripeWebhookEvent {
    // Top-level SDK import, no createRequire dance — ESM safe.
    return this.stripe.webhooks.constructEvent(
      input.rawBody,
      input.signature,
      this.webhookSecret,
    ) as unknown as StripeWebhookEvent;
  }
}

/**
 * Helper for tests + Stripe CLI emulation: sign an event body with the mock secret.
 */
export function signMockWebhook(rawBody: string, secret = MOCK_WEBHOOK_SECRET): string {
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return `t=${t},v1=${sig}`;
}
