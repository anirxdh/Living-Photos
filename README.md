# Living Photos

> Step inside a memory. Upload one old photograph; walk into it in 3D; hear the voice of someone you loved play softly inside the room. Preserved forever.

A hackathon submission for the Stripe + ElevenLabs hackathon (May 2026).

**© 2026 Anirudh Vasudevan — All Rights Reserved.** See [LICENSE](./LICENSE) and [NOTICE.md](./NOTICE.md).

---

## What this is

Living Photos turns an interior photograph into a walkable 3D Gaussian-splat scene with:
- a 3D environment from **World Labs Marble**
- per-object 3D meshes from **FAL Hunyuan3D**
- ambient sound from **ElevenLabs SFX**
- an optional cloned voice narration from **ElevenLabs Instant Voice Cloning**
- one-time **$15 Stripe Checkout** to unlock the scene forever (price set in [`lib/pricing.ts`](./lib/pricing.ts) — override via `NEXT_PUBLIC_PRICE_CENTS`)
- a public share URL (`/s/<slug>`) with custom OG preview

Built as a Next.js 15 + Three.js + Inngest + Stripe app that orchestrates World Labs Marble (3D environment), FAL Hunyuan3D (3D meshes), and the ElevenLabs API (voice clone + ambient SFX + narration) end-to-end.

---

## ⚡ Mock-first

**No API keys required.** With `MOCK_MODE=true` (the default), the entire end-to-end pipeline runs deterministically against in-memory mock adapters in under 5 seconds. Same exact interface as the real adapters — flip one env var to swap.

```bash
pnpm install                # installs deps + auto-installs pre-push git hook
pnpm fixtures:download      # downloads the demo .spz + .glb (~29 MB, one-time, not committed to git)
pnpm dev                    # runs at http://localhost:3000
pnpm test                   # 122 unit + contract tests in <2s
pnpm test:e2e               # Playwright across Chromium + WebKit mobile (8 specs)
pnpm seed                   # in another shell — seeds 3 demo scenes
```

To go to production, see [`DEPLOY.md`](./DEPLOY.md) — full step-by-step procedure (services to sign up for, env vars to set, Stripe activation, Vercel Fluid Compute, custom domain). To swap to real APIs locally, see [`docs/SWAP_TO_REAL.md`](./docs/SWAP_TO_REAL.md).

---

## Tech stack

| Layer        | Choice                                                                     |
|--------------|----------------------------------------------------------------------------|
| Framework    | Next.js 15.5 App Router · React 19 · TypeScript strict                     |
| UI           | Tailwind v4.3 (CSS-first) · shadcn/ui setup · Lucide                       |
| 3D viewer    | React Three Fiber v9 · Drei · Three.js r178                                |
| Background   | Inngest 3 (mandatory — Vercel function timeouts can't hold a 4-5 min run)  |
| Database     | Drizzle ORM + Neon Postgres (in-memory mirror used for MOCK_MODE)          |
| Storage      | Vercel Blob (mock writes to in-memory store)                               |
| Payments     | Stripe 22 · Checkout · raw-body webhook with idempotency table             |
| Voice        | ElevenLabs HTTP API — IVC + TTS narration + SFX (raw fetch, no SDK weight) |
| 3D gen       | World Labs Marble (.spz) + FAL Hunyuan3D (.glb) — via raw fetch            |
| Lint/format  | Biome 2.4                                                                  |
| Tests        | Vitest (unit + contract) · Playwright (e2e Chromium + WebKit mobile)       |

---

## Repository layout

```
app/
  page.tsx                  # /                       landing
  create/                   # /create                 upload UI
  dashboard/                # /dashboard              "My memories"
  scene/[slug]/             # /scene/<slug>           viewer (paid gate)
    success/                # /scene/<slug>/success   post-Checkout
  s/[slug]/                 # /s/<slug>               public share alias
  api/
    health/                 # GET                     health probe
    inngest/                # POST                    Inngest serve route
    scenes/                 # POST + GET              create + list
      [id]/                 # GET                     read
        report/             # POST                    abuse report
    voice/consent/          # GET + POST              consent draft + IVC clone
    stripe/
      checkout/             # POST                    create Checkout session
      mock-fulfill/         # POST                    mock-only: simulate webhook
    webhooks/stripe/        # POST                    signature-verified fulfillment
    blob/upload/            # GET + PUT               signed upload (mock + real)
    og/                     # GET                     OG image (uses @vercel/og)

components/
  viewer/scene-viewer.tsx   # R3F Canvas (dynamic ssr:false)

lib/
  env.ts                    # validated env (Zod)
  utils.ts                  # cn, newId, mockId (deterministic seeded)
  scenes.ts                 # scene CRUD service
  payments.ts               # Checkout + webhook fulfillment + idempotency
  voice/consent.ts          # live-attestation consent gate + denylist
  db/
    schema.ts               # Drizzle schema (Postgres)
    index.ts                # Drizzle client (real)
    memory.ts               # in-memory mirror for MOCK_MODE
  inngest/
    client.ts               # Inngest client (mocked send in MOCK_MODE)
    functions/scene-generate.ts  # 7-step pipeline
  ai/
    types.ts                # Adapter interfaces (the contract)
    factory.ts              # MOCK_MODE swap; Adapters bag
    marble.ts               # Marble adapter (mock + real)
    fal.ts                  # Hunyuan3D adapter (mock + real)
    sfx.ts                  # ElevenLabs SFX (mock + real)
    voice.ts                # ElevenLabs IVC + TTS (mock + real)
    stripe.ts               # Stripe (mock + real, HMAC-signed mock webhook)
    blob.ts                 # Vercel Blob (mock + real)

tests/
  setup.ts                  # MOCK_MODE + state reset
  unit/                     # 12 test files — env, utils, memory, scenes,
                            #   payments, consent, scene-generate, api-*
  contract/                 # 7 adapter contract suites — Mock + Real
                            #   each Real auto-runs when its key is set
  e2e/                      # smoke + full-flow Playwright specs

.github/workflows/ci.yml    # lint → typecheck → unit → e2e
```

---

## Adapter contract pattern (the heart of mock-first)

Every paid upstream is one TypeScript interface (`lib/ai/types.ts`) implemented by:
- a `MockAdapter` — deterministic, no network, fixture URLs
- a `RealAdapter` — `fetch()` (or SDK) against the live service

The `adapters()` factory in `lib/ai/factory.ts` returns the right bag based on `env.MOCK_MODE`.

A **contract test** in `tests/contract/<service>.contract.test.ts` exercises both implementations against the same assertions. If Mock and Real both pass, the swap is guaranteed safe.

Today: 4 of the contract suites have a `.skip()` for the Real implementation that activates the moment you set the corresponding API key.

---

## Pipeline (Inngest, 7 steps)

```
scene/uploaded  →  submit-marble  →  wait-marble       →  detect-objects
                                          ↓
                ←   publish   ←   generate-narration ?  ←   generate-sfx  ←  mesh-objects (∥)
```

Each step is independently retryable. Real mode runs ~4-5 min wall clock; mock mode runs <200ms.

---

## Demo flow (60-second video script)

1. Drop an interior photo on `/create`.
2. Generation spinner. (Live demo uses MOCK_MODE so this is <5s. Recorded demo shows the real ~4min compressed.)
3. The viewer asks for $19. Click "Unlock memory".
4. Stripe Checkout opens. Pay with `4242 4242 4242 4242`.
5. Return to `/scene/<slug>/success` — modal: "Your memory is saved."
6. Click "Step inside →" — walkable 3D scene loads, ambient SFX plays, cloned voice softly narrates.
7. Copy share URL `/s/<slug>` to a friend's phone — they're walking through too.

See [`docs/DEMO.md`](./docs/DEMO.md) for the full script + recording checklist.

---

## Status

- ✅ Phase 1 — Foundation + mock-first adapter infrastructure
- ✅ Phase 2 — Photo upload + scene persistence
- ✅ Phase 3 — Inngest pipeline + mock runner + status polling
- ✅ Phase 4 — Three.js viewer with payment gate
- ✅ Phase 5 — Voice consent gate + IVC + Memory Letter
- ✅ Phase 6 — Stripe Checkout + raw-body webhook with `processed_webhook_events` idempotency floor
- ✅ Phase 7 — Real-adapter contracts (auto-activate when keys present)
- ✅ Phase 8 — Share URLs + OG image + rate-limited abuse reports
- ✅ Phase 9 — Demo prep (this README + docs/DEMO.md + `pnpm seed`)
- ✅ Security pass — MOCK_MODE refused in production, mock-fulfill double-gated, public-figure denylist hardened (NFKD + token-match), scene API strips PII for non-owners, email HTML-escaped

**127 tests** (122 passing + 5 skipped real-adapter slots) across 24 files. 8 Playwright e2e specs. Build clean. Typecheck clean. Lint clean.

---

## Submission tags

`@stripe` `@elevenlabsio` `#ElevenHacks`
