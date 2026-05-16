# Swap to real APIs

The whole product runs end-to-end in MOCK_MODE without any API keys. When you want to flip to real services:

## 1. Get keys

| Service              | Where                                                                                 |
|----------------------|---------------------------------------------------------------------------------------|
| World Labs Marble    | https://platform.worldlabs.ai/ — apply for API; typical waitlist is ~24h              |
| FAL (Hunyuan3D)      | https://fal.ai/dashboard/keys                                                         |
| ElevenLabs           | https://elevenlabs.io/app/settings/api-keys — Creator tier ($22/mo) for IVC          |
| Stripe (test)        | https://dashboard.stripe.com/test/apikeys — Secret + Publishable + Webhook signing   |
| Vercel Blob          | https://vercel.com/dashboard/stores → create Blob store → copy RW token              |
| Neon Postgres        | https://console.neon.tech → create project → copy connection string                  |

## 2. Fill `.env.local`

```bash
MOCK_MODE=false

DATABASE_URL=postgres://...neon.tech/livingphotos
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

WORLD_LABS_API_KEY=...
FAL_KEY=...
ELEVENLABS_API_KEY=...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 3. Migrate the DB

```bash
pnpm db:generate
pnpm db:migrate
```

## 4. Listen for Stripe webhooks locally

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the signing secret it prints into STRIPE_WEBHOOK_SECRET
```

## 5. Run the Inngest dev server

In a separate terminal:

```bash
pnpm dev:inngest
```

## 6. Verify

```bash
pnpm test                # adapter contract tests now activate for Real
pnpm dev                 # upload a photo — pipeline runs against real APIs
```

## What changes

- `lib/ai/factory.ts` `adapters()` now returns the `Real*Adapter` instances. **Zero other code changes.**
- The contract tests in `tests/contract/` will automatically run their previously-skipped Real implementation suite.
- The pipeline takes ~4-5 minutes per scene instead of <5 seconds.
- Real cost per scene: ~$2.50-3.50 (Marble $1.20 + ~5 Hunyuan3D objects $0.80 + SFX $0.03 + voice IVC $0.50 + narration $0.10).
- Stripe Checkout returns its actual hosted URL; the mock-fulfill endpoint refuses (real webhooks handle fulfillment).

## Production deploy (Vercel)

1. Push this repo to GitHub.
2. Import on Vercel.
3. Add all env vars above (set `MOCK_MODE=false`).
4. Enable Fluid Compute on the project (Settings → Functions). Without it the Inngest serve route caps at 15s.
5. Configure Inngest production:
   - Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` from your Inngest dashboard.
   - Sync the production Inngest app to your Vercel URL.
6. Configure Stripe webhook in dashboard pointed at `<your-vercel-url>/api/webhooks/stripe` and copy the signing secret.

## Cost ceiling for the hackathon demo

| Item                | Per scene  |
|---------------------|------------|
| Marble               | $1.20      |
| FAL Hunyuan3D (~5)   | $0.80      |
| ElevenLabs SFX       | $0.03      |
| ElevenLabs IVC       | $0.50      |
| ElevenLabs narration | $0.10      |
| **Total marginal**   | **~$2.63** |
| Sticker price        | $19.00     |
| **Gross margin**     | **~86%**   |

Plan ~$50 in credits for 15-20 demo renders.
