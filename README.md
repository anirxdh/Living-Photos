<div align="center">

# 🌅 Living Photos

### *Step inside a memory you can walk through.*

**Upload one old photograph. Walk into it in 3D. Hear the voice of someone you loved play softly inside the room.**

Built for [ElevenHacks 2026](https://elevenhacks.com) — the Stripe + ElevenLabs hackathon.

[![Built with Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout-635bff?logo=stripe)](https://stripe.com)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-IVC%20%2B%20SFX%20%2B%20Music-000000)](https://elevenlabs.io)
[![Tests](https://img.shields.io/badge/tests-122%20passing-success)](./tests)
[![License](https://img.shields.io/badge/license-Source%20Available-red)](./LICENSE)

### 🎬 [**Live demo → living-photos-rust.vercel.app**](https://living-photos-rust.vercel.app/)

🤝 **Waitlist-only** — [DM on X (@anirxdhv)](https://x.com/agent_e11ven) to get a Living Photo built for you within 24h

</div>

---

## 🔒 Source-Available — Read Before Cloning

> **© 2026 Anirudh Vasudevan. All Rights Reserved.**
>
> This repository is **source-available for hackathon judging and personal review only**. It is **NOT open source.**
>
> You may **view and read** this code. You may **NOT**:
> - Use it commercially, in production, or in any product
> - Redistribute it, host it as a service, or re-publish under any name
> - Create derivative works, ports, or competing products
> - Use it to train any ML model or dataset
> - Remove these notices or the LICENSE file
>
> Full terms: see [LICENSE](./LICENSE) and [NOTICE.md](./NOTICE.md).
> For commercial licensing or partnership, contact [@anirxdh](https://github.com/anirxdh).

---

## ✨ The story

> A man named Walter, 72, finds an old chest in his San Francisco apartment in the year 2067. Inside is a Polaroid camera, an old photo album labeled *Living Photos*, and a folded note. He opens the album, sees a faded photo of his childhood home — and steps inside it. He hears his father's voice from upstairs, just like 60 years ago. He returns to the present holding the note.
>
> *"Thanks to ElevenLabs and Stripe. For making this possible."*

That's the demo. The product makes it real for anyone — turn any photo of a place that mattered into a walkable 3D scene with the voice of someone you loved playing inside it.

---

## 🎬 How it works (end-to-end pipeline)

```
   photo upload
        ↓
   ┌────────────────┐    ┌──────────────────┐    ┌────────────────┐
   │  World Labs    │    │  FAL Hunyuan3D   │    │  ElevenLabs    │
   │  Marble        │ →  │  per-object .glb │    │  IVC + TTS     │
   │  (.spz scene)  │    │  meshes (∥)      │    │  + SFX gen     │
   └────────────────┘    └──────────────────┘    └────────────────┘
        ↓                       ↓                       ↓
        └───────────── Inngest 7-step pipeline ─────────┘
                              ↓
                    ┌────────────────────┐
                    │  Stripe Checkout   │  ← $15 one-time, lifetime unlock
                    │  webhook (HMAC)    │
                    └────────────────────┘
                              ↓
                  /scene/<slug>  → R3F + Three.js viewer
                                 → WASD + drag-to-look
                                 → ambient SFX + voice narration
                                 → shareable /s/<slug>
```

**Real mode runs ~4–5 min wall-clock.** **Mock mode runs in <200ms** with identical interfaces — see "Mock-first" below.

---

## 🚀 Quick start (works without any API keys)

```bash
git clone <repo-url>
cd Stripe-hack

pnpm install                # installs deps + auto-installs pre-push git hook
pnpm fixtures:download      # downloads demo .spz + .glb (~29 MB, one-time)
pnpm dev                    # → http://localhost:3000

# optional, in another shell:
pnpm seed                   # seeds 3 demo memories ready to view
pnpm test                   # 122 unit + contract tests in <2s
pnpm test:e2e               # Playwright across Chromium + WebKit mobile
```

**That's it.** No API keys. No Stripe account. No cloud setup. The entire end-to-end pipeline runs locally on mock adapters in under 5 seconds.

To swap to real APIs locally → [`docs/SWAP_TO_REAL.md`](./docs/SWAP_TO_REAL.md)
To deploy to production → [`DEPLOY.md`](./DEPLOY.md)

---

## ⚡ Mock-first architecture (the killer feature)

Every paid upstream — Marble, FAL, ElevenLabs, Stripe, Vercel Blob — sits behind a single TypeScript interface in `lib/ai/types.ts` with two implementations:

- **`MockAdapter`** — deterministic, no network, fixture URLs, resolves instantly
- **`RealAdapter`** — `fetch()` against the live service

A factory in `lib/ai/factory.ts` swaps based on `env.MOCK_MODE`. A **contract test** runs both implementations against the same assertions. If Mock and Real both pass, **the swap is guaranteed safe**.

This means:
- 🟢 Local dev needs zero credentials
- 🟢 CI tests every endpoint without burning a single API call
- 🟢 Demos run in 5 seconds instead of 5 minutes
- 🟢 Each contract suite auto-activates its real-API test the moment you set the corresponding env var

Today: **4 of 7 contract suites** have a `.skip()` for the Real implementation that wakes up the moment the API key appears in the env.

---

## 🎯 Feature highlights

| | |
|---|---|
| 🏞 **Walkable 3D scenes** | Gaussian-splat environments from World Labs Marble rendered with React Three Fiber. WASD + drag-to-look + scroll-to-zoom. Soft virtual room boundary so you don't walk through walls. |
| 🎙 **Voice cloning with consent gate** | Live-attestation consent flow: user must speak a unique random phrase to prove they own the voice. Public-figure denylist (NFKD-normalized + token-match) prevents impersonation. |
| 🔊 **Procedural ambient SFX** | Per-scene ambient soundscape generated by ElevenLabs SFX. Cached by `sceneId` so repeat plays cost nothing. |
| 💳 **Stripe Checkout + webhook idempotency** | One-time $15 unlock. Raw-body HMAC webhook verification. Idempotency floor via `processed_webhook_events` unique constraint — same event can hit the webhook 1,000 times and only fulfills once. |
| 📱 **Mobile-aware rendering** | Detects mobile UA and serves a low-poly splat tier to avoid Safari WebGL crashes on heavy worlds. |
| 🔗 **Shareable links + OG previews** | `/s/<slug>` public alias with dynamically generated OG image (Vercel OG runtime) so previews look polished in iMessage/Slack/Twitter. |
| 🚨 **Abuse reporting** | Rate-limited reporting endpoint (rolling 1-hour window per IP). Reports surface in the dev admin panel; verified violations purge within an hour. |
| 🎨 **Painterly cinematic landing page** | Custom hero with looping video background, Lenis smooth-scroll, framer-motion entrance reveals, cherry-blossom particle layer, magnetic CTAs, parallax tilt cards. |

---

## 🧰 Tech stack

| Layer | Choice |
|---|---|
| **Framework** | Next.js 15.5 App Router · React 19 · TypeScript strict |
| **UI** | Tailwind v4.3 (CSS-first) · shadcn/ui setup · Lucide icons |
| **Motion** | Framer Motion · Lenis smooth-scroll · custom Tilt3D + MouseParallax |
| **3D viewer** | React Three Fiber v9 · Drei · Three.js r178 · custom WASD controls |
| **Background** | Inngest 3 (mandatory — Vercel function timeouts can't hold a 4–5 min run) |
| **Database** | Drizzle ORM + Neon Postgres (in-memory mirror for MOCK_MODE) |
| **Storage** | Vercel Blob (mock writes to in-memory store) |
| **Payments** | Stripe 22 · Checkout · raw-body webhook with idempotency table |
| **Voice + Audio** | ElevenLabs HTTP API — IVC + TTS + Music + SFX (raw fetch, no SDK weight) |
| **3D generation** | World Labs Marble (`.spz`) + FAL Hunyuan3D (`.glb`) — via raw fetch |
| **Lint/format** | Biome 2.4 |
| **Tests** | Vitest (unit + contract) · Playwright (e2e Chromium + WebKit mobile) |
| **CI** | GitHub Actions: lint → typecheck → unit → e2e |

---

## 📂 Repository layout

```
app/
├── page.tsx                  /                       cinematic landing
├── create/                   /create                 upload + voice consent UI
├── dashboard/                /dashboard              "My memories"
├── scene/[slug]/             /scene/<slug>           3D viewer (paid gate)
│   └── success/              /scene/<slug>/success   post-Checkout celebration
├── s/[slug]/                 /s/<slug>               public share alias
├── press/                    /press                  hackathon press kit
└── api/
    ├── scenes/               POST + GET              create + list
    │   └── [id]/             GET / report            read + abuse report
    ├── voice/consent/        GET + POST              consent draft + IVC clone
    ├── stripe/
    │   ├── checkout/         POST                    create Checkout session
    │   └── mock-fulfill/     POST                    mock-only webhook sim
    ├── webhooks/stripe/      POST                    HMAC-verified fulfillment
    ├── blob/upload/          GET + PUT               signed upload (mock + real)
    ├── og/                   GET                     dynamic OG image
    ├── inngest/              POST                    Inngest serve route
    └── debug/                                        dev-only admin routes

components/
├── landing/                  hero · how-it-works · live-proof · emotional · pricing · CTA
├── viewer/scene-viewer.tsx   R3F Canvas (dynamic ssr:false) + WASD controls
└── motion/                   custom Lenis hooks · cursor-reveal · tilt-3d · parallax

lib/
├── env.ts                    Zod-validated env loader
├── scenes.ts                 scene CRUD service
├── payments.ts               Checkout + webhook fulfillment + idempotency
├── voice/consent.ts          live-attestation gate + public-figure denylist
├── db/
│   ├── schema.ts             Drizzle schema (Postgres)
│   └── memory.ts             in-memory mirror for MOCK_MODE
├── inngest/
│   ├── client.ts             Inngest client (mocked send in MOCK_MODE)
│   └── functions/            7-step pipeline
└── ai/                       Adapter pattern — Mock + Real for every paid API
    ├── types.ts              The contract
    ├── factory.ts            MOCK_MODE swap; Adapters bag
    ├── marble.ts             Marble adapter
    ├── fal.ts                Hunyuan3D adapter
    ├── sfx.ts                ElevenLabs SFX
    ├── voice.ts              ElevenLabs IVC + TTS
    ├── stripe.ts             Stripe (HMAC-signed mock webhook)
    └── blob.ts               Vercel Blob

tests/
├── unit/                     12 files — env, utils, memory, scenes, payments, consent, scene-generate, api-*
├── contract/                 7 adapter contract suites — Mock + Real (auto-skips when key absent)
└── e2e/                      smoke + full-flow Playwright specs

scripts/
├── seed-demo.ts              seeds 3 demo memories
├── generate-demo-voices.ts   ElevenLabs TTS batch generator (demo narration)
├── generate-demo-music.ts    ElevenLabs Music batch generator (per-scene BGM)
├── generate-demo-sfx.ts      ElevenLabs Sound Generation batch
└── mix-pages.ts              ffmpeg per-comic-page audio mixer

audio/                        generated voice + music + SFX assets for the demo video
```

---

## 🎞 Demo video pipeline

The submission includes a 2:30 cinematic demo video built entirely with this codebase's tooling:

- **6 painterly comic pages** generated by Midjourney with custom Style References + Omni Reference (Walter character lock)
- **25 voice clips** generated via ElevenLabs Text-to-Speech (5 voice IDs: narrator, Walter, Walter's dad, daughter Anna, young Walter)
- **7 BGM tracks** generated via ElevenLabs Music API (per-scene cinematic orchestral)
- **18 SFX clips** generated via ElevenLabs Sound Generation (broom, dust POOF, chest creak, FWOOOSH transition, summer ambience, footsteps, paper unfold, closing chime, etc.)
- **6 per-page master mixes** assembled via ffmpeg with voice/music/SFX volume rules + sidechain ducking

Run it yourself:

```bash
pnpm tsx scripts/generate-demo-voices.ts   # → audio/{narrator,walter,dad,anna,kid}/
pnpm tsx scripts/generate-demo-music.ts    # → audio/music/
pnpm tsx scripts/generate-demo-sfx.ts      # → audio/sfx/
pnpm tsx scripts/mix-pages.ts              # → audio/master/PAGE-{01..06}.mp3
```

Then drop the 6 page MP3s + the comic page images into CapCut, add Ken Burns motion, and you have the video.

---

## 🛡 Security + privacy

- **Voice consent gate**: live-attestation phrase required; uploads of pre-recorded files of someone else's voice are blocked by voiceprint mismatch
- **Public-figure denylist**: NFKD-normalized token-match prevents impersonating world leaders, celebrities, recent deceased
- **MOCK_MODE refused in production**: env validator throws on boot if `NODE_ENV=production` and `MOCK_MODE=true`
- **Mock-fulfill double-gated**: dev-only endpoint refuses requests in production AND when `MOCK_MODE=false`
- **Webhook idempotency floor**: `processed_webhook_events` unique constraint on `(provider, event_id)` — same event can hit 1,000 times, fulfills exactly once
- **Email HTML-escaped** before insertion into emails
- **Rate-limited abuse reports**: rolling 1-hour bucket per IP

---

## 📊 Status

| Phase | Description | Status |
|---|---|---|
| 1 | Foundation + mock-first adapter infrastructure | ✅ |
| 2 | Photo upload + scene persistence | ✅ |
| 3 | Inngest pipeline + mock runner + status polling | ✅ |
| 4 | Three.js viewer with payment gate | ✅ |
| 5 | Voice consent gate + IVC + Memory Letter | ✅ |
| 6 | Stripe Checkout + raw-body webhook + idempotency floor | ✅ |
| 7 | Real-adapter contracts (auto-activate when keys present) | ✅ |
| 8 | Share URLs + OG image + rate-limited abuse reports | ✅ |
| 9 | Demo prep — README, video script, seed scenes | ✅ |
| 10 | Security pass — denylist, MOCK_MODE guards, PII strip, HTML escape | ✅ |

**Quality bar:** 122 tests passing + 5 skipped (real-adapter slots) across 24 files. 8 Playwright e2e specs. Build clean. Typecheck clean. Lint clean.

---

## 🙏 Credits

This project orchestrates the work of incredible teams:

- **[ElevenLabs](https://elevenlabs.io)** — Instant Voice Cloning, TTS, Sound Effects, Music API
- **[Stripe](https://stripe.com)** — Checkout + Webhooks
- **[World Labs](https://www.worldlabs.ai)** — Marble (Gaussian-splat 3D from a single image)
- **[FAL](https://fal.ai)** — Hunyuan3D mesh generation
- **[Vercel](https://vercel.com)** — Hosting + Blob storage + OG image runtime
- **[Inngest](https://inngest.com)** — Durable workflow orchestration
- **[Neon](https://neon.tech)** — Serverless Postgres
- **[Midjourney](https://midjourney.com)** — Demo video comic art

---

## 🏷 Submission

`@stripe` `@elevenlabsio` `#ElevenHacks` `#ElevenHacks2026`

Built with care for the people whose voices we wish we could still hear.

<div align="center">

### 🎬 [Live demo → living-photos-rust.vercel.app](https://living-photos-rust.vercel.app/)

[GitHub](https://github.com/anirxdh/Living-Photos) · [X / Twitter (@anirxdhv) — waitlist DMs](https://x.com/anirxdhv)

*Built by [Anirudh Vasudevan](https://github.com/anirxdh) · May 2026 · San Francisco*

</div>
