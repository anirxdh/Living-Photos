# Membership Subscription — Design Spec

**Date:** 2026-05-16
**Status:** Approved, pending implementation
**Owner:** Anirudh Vasudevan

## Goal

Add a recurring membership tier ($19/month for 5 memories) alongside the existing one-time $19 per-memory purchase. Subscribers consume "credits" instead of paying per memory. Both paths must coexist seamlessly. Must be Stripe-native (Subscriptions API), have full mock/real adapter parity, and be tested end-to-end.

## Non-goals

- Multi-tier pricing (single tier ships first; Silver/Gold/etc. is V2)
- Annual billing (monthly only for V1)
- Credit rollover across months (reset model only)
- Refunds / proration on plan changes (not applicable to single-tier)
- Self-serve plan changes (only subscribe + cancel for V1)

## Product shape

```
One memory      $19 one-time     — unchanged, existing Stripe Checkout flow
Membership      $19 / month      — 5 memories per billing cycle, reset monthly
```

**Coexistence rules:**
- Subscriber with credits: scene creation uses a credit, no Checkout
- Subscriber out of credits: falls back to one-time $19 Checkout (no upsell friction)
- Non-subscriber: existing one-time Checkout, no change

## Credit model

- 5 credits granted on `customer.subscription.created` and on each `invoice.paid` renewal
- Unused credits **expire** at period end — no rollover
- Cancellation: credits remain usable until `creditsPeriodEnd`, then drop to 0
- Reason: cleanest mental model, standard SaaS pattern, no liability of carrying credits forever

## Data model

Add 4 columns to existing `users` table:

```ts
stripeSubscriptionId  text             // sub_xxx, null if no active sub
subscriptionStatus    text             // 'active' | 'past_due' | 'canceled' | null
creditBalance         integer default 0
creditsPeriodEnd      timestamp        // when current billing cycle ends
```

All subscription state derives from these 4 fields + Stripe webhooks. No new tables.

## Stripe integration

### New env var

```
STRIPE_MEMBERSHIP_PRICE_ID=price_xxx
```

Created once in Stripe Dashboard:
1. Products → Add product → "Living Photos Membership"
2. Pricing: $19.00 USD, recurring, monthly
3. Copy the price ID (`price_1XXX...`) into `.env.local`

### New adapter methods

Add to `StripeAdapter` interface (`lib/ai/types.ts`):

```ts
createSubscriptionCheckout(input: {
  priceId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }>;

cancelSubscription(subscriptionId: string): Promise<{ status: string; cancelAt: Date }>;

getSubscription(subscriptionId: string): Promise<{
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}>;
```

`MockStripeAdapter` returns deterministic `sub_mock_<hash>` IDs and simulates monthly cycles.
`RealStripeAdapter` calls real Stripe SDK methods.

### Webhook events handled

Extend `app/api/webhooks/stripe/route.ts` to handle 4 new event types:

| Event | Action |
|---|---|
| `customer.subscription.created` | upsert user, `status='active'`, `creditBalance=5`, set `creditsPeriodEnd`, save `stripeSubscriptionId` |
| `invoice.paid` (recurring renewal) | refill `creditBalance=5`, advance `creditsPeriodEnd` |
| `customer.subscription.deleted` | `status='canceled'`, leave credits intact until `creditsPeriodEnd` (cron / lazy expiration zeroes them) |
| `invoice.payment_failed` | `status='past_due'` (Stripe handles retries automatically — we just reflect state) |

Idempotency: existing `processed_webhook_events` table already enforces UNIQUE(provider, event_id). New event types use the same path — no changes needed.

## Credit consumption — integrated into existing scene creation

Modify `app/api/scenes/route.ts` POST handler:

```ts
if (user has active subscription AND creditBalance > 0 AND creditsPeriodEnd > now) {
  // Subscription path — no Checkout
  decrementCredit(user.id);
  insertScene({ ...input, paid: true, pricePaidCents: 0 });
  trigger pipeline;
  return { sceneId, redirectUrl: `/scene/${slug}` };  // skip checkout
} else {
  // Existing path — Stripe Checkout for $19
  insertScene({ ...input, paid: false });
  return { sceneId, requiresPayment: true };
}
```

The frontend (`/create` page) handles both response shapes: subscription path navigates straight to the scene, non-subscription path triggers the existing Checkout fetch.

## UI changes

| Where | What |
|---|---|
| `/pricing` | Two-card layout: "One memory $19" / "Membership $19/mo · 5 memories" |
| `/dashboard` | Credit chip: "3 of 5 memories left · renews Jul 16" + Cancel link |
| `/create` | If subscribed, CTA reads "Use 1 credit (4 left)" instead of "$19" |
| Nav | Tiny credit counter chip next to "My memories" when subscribed |

## Cancellation flow

User clicks "Cancel subscription" in `/dashboard`:
1. POST `/api/stripe/cancel-subscription` with their email
2. Server calls `stripe.cancelSubscription(subId)` — sets `cancel_at_period_end: true`
3. User keeps `status='active'` until period end, then Stripe fires `customer.subscription.deleted` → status flips to `'canceled'`
4. Credits remain usable until period end

We do NOT offer immediate cancellation (refund + revoke). Always grace until period end. Simpler, fairer.

## Failed payment

Stripe automatic retry logic handles this:
- Attempt 1: at invoice creation
- Attempts 2-4: spread over ~3 weeks via Smart Retries
- After all retries fail: `customer.subscription.deleted` fires → status `'canceled'`

We just reflect state via webhooks. No custom retry logic needed.

Email notifications (Resend integration already exists) on `invoice.payment_failed`: "We couldn't charge your card — update payment method here."

## Testing

### Unit tests
- `consumeCredit(userId)` — happy path, no credits, expired period
- `refillCredits(userId, 5, periodEnd)` — fresh user, existing balance overwritten
- State transitions: subscription created / renewed / canceled / past_due

### Integration tests
- Each of the 4 webhook handlers with mock-signed events
- Idempotency: replay same event ID, only first call mutates
- Scene creation with active subscription bypasses Checkout

### E2E test (vitest + supertest)
Full flow scripted:
1. User subscribes → webhook fires → user has 5 credits
2. Create 3 scenes → balance = 2, all scenes paid via credit
3. Simulate `invoice.paid` renewal → balance refills to 5
4. Cancel subscription → status='canceled' but credits remain
5. Advance time past period end → credits expire to 0
6. Create scene → falls back to one-time Checkout

### Manual smoke (Stripe CLI)
With `STRIPE_FORCE_REAL=true`:
1. Subscribe via real Stripe Checkout (test card)
2. Stripe CLI shows `customer.subscription.created` event
3. Dashboard shows 5 credits
4. `stripe trigger invoice.paid` to simulate renewal
5. `stripe trigger customer.subscription.deleted` to simulate cancellation

## Migration / backwards compat

- No breaking changes to existing schema or routes
- Drizzle migration adds 4 columns with safe defaults (`null` / `0`)
- Existing scenes/payments/dashboard logic unchanged
- Existing one-time $19 flow unchanged
- `MockStripeAdapter` returns deterministic sub IDs for tests
- `RealStripeAdapter` only requires `STRIPE_MEMBERSHIP_PRICE_ID` to be set (defaults to a sentinel that throws clearly if used without setup)

## Out of scope (V2 candidates)

- Multi-tier pricing (Silver / Gold)
- Annual billing with discount
- Credit rollover
- Gifting subscriptions
- Team / family plans
- Self-serve plan switching (upgrade / downgrade)
- Coupon codes
- Customer portal (Stripe-hosted billing self-service)

## Implementation phases

1. **Schema + storage** — add user columns, update mem store, Drizzle migration
2. **Adapter contract** — extend StripeAdapter, implement Mock + Real
3. **Webhook handlers** — wire 4 new event types into existing webhook route
4. **Credit logic** — `consumeCredit` / `refillCredits` helpers, integration into scene POST
5. **UI** — `/pricing` cards, `/dashboard` credit chip + cancel, `/create` CTA swap, nav chip
6. **Tests** — unit + integration + E2E
7. **Manual verification** — Stripe CLI smoke with `STRIPE_FORCE_REAL=true`
