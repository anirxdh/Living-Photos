# Living Photos

> Step inside a memory. Upload one old photograph; walk into it in 3D; hear the voice of someone you loved play softly inside the room. Preserved forever.

A hackathon submission for the Stripe + ElevenLabs hackathon (May 2026).

---

## What this is

Living Photos turns an interior photograph into a walkable 3D Gaussian-splat scene with:
- a 3D environment from **World Labs Marble**
- per-object 3D meshes from **FAL Hunyuan3D**
- ambient sound from **ElevenLabs SFX**
- an optional cloned voice narration from **ElevenLabs Instant Voice Cloning**
- one-time **$19 Stripe Checkout** to unlock the scene forever
- a public share URL (`/s/<slug>`) with custom OG preview

Built on top of the open-source [`image-blaster`](https://github.com/neilsonnn/image-blaster) pipeline (kept in `vendor/` for reference), wrapped in a Next.js 15 + Three.js + Inngest + Stripe app.

---

## ⚡ Mock-first

**No API keys required.** With `MOCK_MODE=true` (the default), the entire end-to-end pipeline runs deterministically against in-memory mock adapters in under 5 seconds. Same exact interface as the real adapters — flip one env var to swap.

```bash
pnpm install
pnpm dev               # runs at http://localhost:3000
pnpm test              # 96 unit + contract tests in <1s
pnpm test:e2e          # Playwright across Chromium + WebKit mobile
```

To swap to real APIs, fill out `.env.local` with your keys and set `MOCK_MODE=false`. See [`docs/SWAP_TO_REAL.md`](./docs/SWAP_TO_REAL.md).

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
| Voice        | `@elevenlabs/elevenlabs-js` 2.47 — IVC + TTS narration + SFX               |
| 3D gen       | World Labs Marble (.spz) + FAL Hunyuan3D (.glb)                            |
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

- ✅ Phase 1 — Foundation + mock-first adapter infrastructure (49 tests)
- ✅ Phase 2 — Photo upload + scene persistence (+7 tests)
- ✅ Phase 3 — Inngest pipeline + status polling
- ✅ Phase 4 — Three.js viewer with payment gate
- ✅ Phase 5 — Voice consent gate + IVC (+11 tests)
- ✅ Phase 6 — Stripe Checkout + webhook with idempotency (+15 tests across api + payments)
- ✅ Phase 7 — Real-adapter contracts (auto-activate when keys present)
- ✅ Phase 8 — Share URLs + OG image + abuse reporting (+3 tests)
- ✅ Phase 9 — Demo prep (this README + docs/DEMO.md)

**100 tests** (96 passing + 4 skipped real-adapter slots). Build clean. Typecheck clean. Lint clean.

---

## Submission tags

`@stripe` `@elevenlabsio` `#ElevenHacks`
