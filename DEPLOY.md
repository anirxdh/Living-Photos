# Deploy Living Photos to Production

This guide takes you from "code on GitHub" → "live URL that real users can pay on" in roughly 1–2 hours of setup, plus a 24-hour wait for Stripe identity verification.

## Pre-flight check

Before starting, you should have:
- A US bank account (for Stripe payouts)
- A credit card (for paid service signups: ElevenLabs $22/mo)
- An email you'll use for service accounts
- The repo already on GitHub: https://github.com/anirxdh/Living-Photos

## What you're signing up for

| # | Service | Free? | Why |
|---|---------|-------|-----|
| 1 | [Vercel](https://vercel.com) | ✅ Free tier | Hosts the Next.js app |
| 2 | [Neon](https://neon.tech) | ✅ Free tier | Postgres for scenes / users / payments |
| 3 | [Vercel Blob](https://vercel.com/storage/blob) | ✅ Free tier | Photo + voice file storage |
| 4 | [Inngest](https://www.inngest.com/) | ✅ Free tier | Background pipeline orchestration |
| 5 | [World Labs Marble](https://www.worldlabs.ai/) | 💲 Per-use (~$2.50/scene) | Photo → 3D scene |
| 6 | [FAL.ai](https://fal.ai/) | 💲 Per-use (~$0.16/object) | 3D object meshes |
| 7 | [ElevenLabs](https://elevenlabs.io/) | 💲 Creator $22/mo | Voice clone + TTS + SFX |
| 8 | [Stripe](https://stripe.com/) | 💲 2.9% + 30¢ per charge | Payments |

Optional:
- [Resend](https://resend.com/) for post-purchase emails
- [Sentry](https://sentry.io/) for error monitoring
- [PostHog](https://posthog.com/) for analytics
- A custom domain (Namecheap / Cloudflare)

## Step 1 — Sign up for the 8 services (~25 min)

You can do most in parallel while waiting for confirmation emails.

### 1.1 Vercel
- https://vercel.com/new → "Import Git Repository" → pick `anirxdh/Living-Photos`
- It'll fail the first build because env vars aren't set — that's fine, we'll come back
- Note the project URL (e.g. `living-photos-xyz.vercel.app`)

### 1.2 Neon Postgres
- https://console.neon.tech → New Project → US East
- Copy the **pooled connection string** (it includes `?sslmode=require&channel_binding=require`)
- Save as `DATABASE_URL`

### 1.3 Vercel Blob
- Vercel Dashboard → your project → **Storage** → Create Database → **Blob**
- Click "Connect to Project"
- Copy `BLOB_READ_WRITE_TOKEN`

### 1.4 Inngest
- https://app.inngest.com/sign-up → create account → New App
- Settings → Event Keys → copy `INNGEST_EVENT_KEY`
- Settings → Signing Keys → copy `INNGEST_SIGNING_KEY`

### 1.5 World Labs Marble
- https://www.worldlabs.ai/ → Apply for API access (may take 24-48h)
- Once approved, copy `WORLD_LABS_API_KEY`

### 1.6 FAL.ai
- https://fal.ai → Sign up → Dashboard → API Keys → create key
- Copy `FAL_KEY` (format: `<key-id>:<secret>`)

### 1.7 ElevenLabs
- https://elevenlabs.io/app/subscription → **Creator** plan ($22/mo)
- Profile → API Keys → copy `ELEVENLABS_API_KEY`

### 1.8 Stripe (longest, ~24h activation)
- https://dashboard.stripe.com/register → create account
- Settings → Account → Complete identity verification:
  - Legal name, DOB, SSN (last 4)
  - Business type (Sole Proprietor is fine for solo)
  - US bank account routing + account number
- Wait for "Your account is now active" email (usually <24h)
- Once active: Developers → API keys → copy `sk_live_...` + `pk_live_...`
- Developers → Webhooks → Add endpoint:
  - URL: `https://yourdomain.com/api/webhooks/stripe`
  - Events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.succeeded`
  - Copy the live `whsec_live_...` signing secret

## Step 2 — Set Vercel environment variables (~5 min)

Vercel project → Settings → Environment Variables → add for **Production**:

```bash
# Mode
MOCK_MODE=false
NEXT_PUBLIC_APP_URL=https://yourdomain.com   # or https://your-app.vercel.app

# Database + storage
DATABASE_URL=postgres://...neon.tech/...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# AI providers
WORLD_LABS_API_KEY=...
FAL_KEY=...:...
ELEVENLABS_API_KEY=...

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_PRICE_CENTS=1500              # $15 per memory — change here to change everywhere

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Optional
RESEND_API_KEY=                            # leave blank to skip emails
RESEND_FROM_EMAIL=Living Photos <hello@yourdomain.com>
SENTRY_DSN=                                # leave blank to skip Sentry
NEXT_PUBLIC_POSTHOG_KEY=                   # leave blank to skip PostHog
```

## Step 3 — Run database migrations (~3 min)

After Vercel env vars are set:

```bash
# Locally, pull the production env temporarily
npx vercel env pull .env.production.local

# Push schema to Neon
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d= -f2-) pnpm db:push

# Delete the local file (don't commit!)
rm .env.production.local
```

`pnpm db:push` creates the `users`, `scenes`, `voice_clones`, `payments`, and `processed_webhook_events` tables in your Neon database.

## Step 4 — Enable Fluid Compute (~30 seconds)

Vercel project → Settings → Functions → **Fluid Compute** = ON

Why: the photo → 3D pipeline takes 4–5 minutes. Default Vercel function timeout is 15 seconds, which would kill the pipeline. Fluid Compute raises this.

## Step 5 — Register Inngest app (~2 min)

Inngest dashboard → your app → Settings → register the endpoint:
- URL: `https://yourdomain.com/api/inngest`

Inngest will ping this URL to discover your functions. Should show "1 function registered: scene-generate".

## Step 6 — Deploy + smoke test (~5 min)

```bash
# Trigger a fresh deploy (or push any commit)
git commit --allow-empty -m "deploy: kick off prod build"
git push origin main
```

Wait for green build in Vercel. Then on the live URL:

1. Open `https://yourdomain.com`
2. Click **Bring a memory to life** → upload a real interior photo (kitchen, bedroom, etc — see /create page for guidance)
3. Click pay → real Stripe Checkout opens
4. Pay with `4242 4242 4242 4242` first to confirm test mode works (cancel before submitting if you don't want to be charged)
5. Then with a real card: $15 charge → scene generates over ~4-5 min → walk through

If anything fails:
- Vercel project → Deployments → click latest → **Functions** tab → see logs per endpoint
- Most common failure: a service rate-limited or out-of-credit. Check the provider's dashboard.

## Step 7 — Custom domain (optional, ~10 min)

If you want `livingphotos.app` instead of `*.vercel.app`:
1. Buy domain (Namecheap / Cloudflare)
2. Vercel project → Settings → Domains → add the domain
3. Add the DNS records Vercel shows (usually `CNAME @ cname.vercel-dns.com`)
4. Wait ~15 min for SSL provisioning
5. Update `NEXT_PUBLIC_APP_URL` env var to the new domain
6. Update the Stripe webhook URL too

## Going from $15 one-time to subscriptions (post-V1)

The single-tier $19/mo membership scheme is fully designed:
- Spec: `docs/superpowers/specs/2026-05-16-membership-subscription-design.md`
- Plan: `docs/superpowers/plans/2026-05-16-membership-subscription.md`

16 TDD tasks, ~3-4 hours of focused work. Add when you're ready to retain users.

## Going from US-only to international

- Stripe: enable additional payment methods in Dashboard (Apple Pay, Google Pay, SEPA, etc.)
- US tax (US-only): Stripe Tax + Sales tax registration in states you sell into
- EU tax: VAT registration, EU-MOSS, GDPR cookie banner

## Cost economics

| Per scene generated | Cost |
|---|---|
| World Labs Marble | ~$2.50 |
| FAL Hunyuan3D (avg 4 meshes) | ~$0.64 |
| ElevenLabs voice clone + TTS + SFX | ~$0.40 |
| Stripe fee on $15 | $0.74 |
| **Total cost** | **~$4.28** |
| **You take home** | **~$10.72** |

ElevenLabs Creator ($22/mo) is fixed regardless of volume. So:
- 0 scenes / month = -$22 (just the ElevenLabs subscription)
- 10 scenes = -$22 + 10×$10.72 = **+$85**
- 100 scenes = -$22 + 100×$10.72 = **+$1,050**

Breakeven: ~3 scenes/month covers the ElevenLabs floor.

## After deployment — monitoring

- Vercel Analytics (free tier) — page views + performance
- Stripe Dashboard — payments + payouts
- Inngest Dashboard — pipeline run history + failure rates
- Sentry (optional) — runtime errors
- PostHog (optional) — funnel: visit → upload → pay → walk-through completion
