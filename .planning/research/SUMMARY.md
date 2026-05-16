# Project Research Summary

**Project:** Living Photos
**Domain:** Consumer AI — image-to-walkable-3D-scene + voice clone + Stripe payments (memorial / nostalgia)
**Researched:** 2026-05-15
**Confidence:** HIGH

## Executive Summary

Living Photos is a consumer AI product that fuses three product categories — AI 3D scene generation (Luma/Polycam/World Labs), memorial/nostalgia AI (MyHeritage Deep Nostalgia, HereAfter), and single-shot generative virality (Pika/Higgsfield) — into one shareable URL. The research is unanimous on the technical approach: **Next.js 15.5 App Router + R3F v9.6.1 + Spark.js for splats + Inngest as the job orchestrator + Stripe Meters + ElevenLabs IVC, with every paid API wrapped in a mock-first adapter so the entire product runs end-to-end with `MOCK_MODE=true` and zero API keys.** The mock-first constraint is not a workaround — it is a foundational architectural pattern: each upstream (World Labs Marble, FAL Hunyuan3D, ElevenLabs SFX/IVC, Stripe) must satisfy a single `Adapter` interface that both a deterministic `MockAdapter` and a `RealAdapter` implement, so the env flag flips between them without code changes elsewhere.

Three decisions are non-negotiable and must be surfaced loudly in the roadmap: **(1) Inngest is mandatory, not optional** — the 4-5 minute pipeline cannot run inside a Next.js API route (Vercel Hobby caps at 60s, Pro at 800s with Fluid Compute, and even then the request-response cycle dies); the only correct pattern is `inngest.send()` → `step.run()` → `step.waitForEvent()` for upstream webhooks. **(2) Spark.js is the splat renderer**, not the unmaintained GaussianSplats3D or drei's basic `<Splat />` — Spark.js is the only actively maintained `.spz` renderer in 2026, ships R3F bindings (`@sparkjsdev/spark-react-r3f`), and is what World Labs itself uses. **(3) The voice consent gate is live-attestation**, not a checkbox — this is a legal landmine (California AB 1836, AB 2602, EU AI Act, the 2wai PR firestorm, the May 2026 ElevenLabs Illinois lawsuit) and must be wired before any IVC API call is reachable from the frontend.

The chief risks are well-understood: (a) live demo death from a 5-minute synchronous generation — mitigate with pre-rendered fallback scenes and a deterministic mock that demos at <5s, (b) iPhone Safari WebGL crashes when serving 500K-gaussian splats to phones — mitigate with a LowPoly tier and aggressive Canvas perf params, (c) Stripe webhook double-fulfillment without idempotency — mitigate with a `processed_webhook_events` unique-constraint table, (d) ElevenLabs credit burn at 2.8× advertised rate from unbounded regeneration — mitigate with MP3 caching by `hash(voiceId + text)` and a hard regen cap, (e) Hunyuan3D producing uncanny extruded faces from photos with people — mitigate with person-detection-and-inpaint preprocessing before V3's Hedra avatar replacement lands. The testing-first policy (Playwright e2e + Vitest unit + adapter contract tests verifying mock and real shape parity) is the throughline that makes the mock-first strategy work: if both adapters pass the same contract test, the swap is safe.

## Key Findings

### Recommended Stack

The stack is opinionated and version-pinned for a 3-day hackathon: pick the most-recommended modern primitive at each layer, pin to known-compatible versions, and use `pnpm` (not `npm`) to avoid the React 19 + shadcn/ui peer-dep `--legacy-peer-deps` trap. The integration-pattern decisions matter more than the framework choices — specifically the Inngest orchestration pattern and the Spark.js R3F-bindings pattern.

**Core technologies:**
- **Next.js 15.5 App Router + React 19** — constraint-mandated; pin 15.5 (not 16) so the entire R3F + shadcn + Clerk + Inngest ecosystem still documents matching patterns
- **TypeScript 5.5+ with `strict: true`** — payment + voice consent code must be type-safe
- **Tailwind v4.3 + shadcn/ui** — CSS-first config via `@import "tailwindcss"`, no `tailwind.config.ts`
- **Three.js r178 + @react-three/fiber 9.6.1 + @react-three/drei 10.5** — R3F v9 = React 19 (v8 silently breaks); r178 is the last "boring" release before r180+ NodeMaterial reshuffles
- **@sparkjsdev/spark + @sparkjsdev/spark-react-r3f** — the only production-grade `.spz` renderer in 2026; WebGL2 + iOS-compatible; declarative `<SparkRenderer />` + `<SplatMesh />` JSX
- **Stripe Node 22.1 (API `2026-04-22.dahlia`) + Stripe Billing Meters** — legacy usage records API is GONE since `2025-03-31.basil`; metered prices require a Meter object
- **@elevenlabs/elevenlabs-js@2.47** — official current SDK; the older `elevenlabs` (v1.59) package is DEPRECATED; `@elevenlabs/client` is browser-only
- **@fal-ai/client** (not deprecated `@fal-ai/serverless-client`) for Hunyuan3D long-poll
- **Inngest 3.x** — MANDATORY for the 5-min pipeline; free tier (50k runs/mo, 5 concurrent steps) covers the hackathon
- **Vercel + Fluid Compute + Vercel Blob** — Fluid Compute REQUIRED (without it, Pro caps at 15s function execution); Blob for `.spz/.glb/.mp3` asset hosting via client-direct signed-URL uploads
- **Neon Postgres + Drizzle ORM** — Drizzle for 5× faster cold starts than Prisma on serverless; Neon's HTTP driver pairs cleanly
- **Clerk (`@clerk/nextjs@6`)** — fastest hackathon auth; optionally deferred behind Stripe customer email for V1
- **Sentry + PostHog** — error tracking + session replay (critical for judging — replay shows the judge what users do)
- **Zod, react-dropzone, lucide-react, sonner** — supporting libraries
- **pnpm + Turbopack + Biome + Stripe CLI + Drizzle Kit** — dev tooling

Full detail: see `.planning/research/STACK.md`. Confidence on every major recommendation is HIGH (npm-verified, vendor-doc-verified).

### Expected Features

The product must hit table-stakes from three converged categories on Day 1. Differentiation comes from being the ONLY product fusing walkable 3D + cloned voice + memorial framing in one shareable URL — no competitor (MyHeritage, HereAfter, Luma, Polycam) does all three.

**Must have (table stakes — V1 hackathon scope):**
- Photo upload (drag-drop + file picker) with `react-dropzone` + Vercel Blob client-direct upload
- Auth (Clerk magic link OR deferred — capture email at Stripe Checkout)
- Stripe Checkout — $19 one-time hosted page; Apple Pay / Google Pay built-in
- Generation pipeline running asynchronously via Inngest; 4-5 min wall clock real / <5s mock
- Progress UI with phase markers (`useInngestSubscription` from `@inngest/realtime`)
- Three.js + Spark.js walkable 3D viewer (mouse + WASD desktop, touch joystick mobile)
- Voice upload + LIVE-ATTESTATION consent gate + ElevenLabs IVC
- Ambient voice narration playing inside the scene (via `<PositionalAudio>`)
- Shareable URL `/s/[slug]` — public, no auth required to view
- OG image generation for share preview
- Mobile Safari rendering verified on real iPhone 12+ (NOT just simulator)
- "My Memories" dashboard
- Email completion notification (Resend)
- Memorial-framed copy throughout ("step inside the memory", "preserved forever") — NOT scan/render/export language

**Should have (V1.5 — differentiators):**
- 15-second cinematic MP4 demo reel auto-generated server-side (9:16 + 1:1) — critical for TikTok/IG virality
- Stripe subscription tier ($49/yr unlimited) using Billing Meters
- Memory Letter (text → cloned voice TTS) — low effort, high emotional payoff
- One-tap social share modal with pre-built captions
- Public opt-in gallery
- Lifetime $299 plan

**Defer (v2+ — out of scope for hackathon):**
- Multi-photo stitching (V2), Hedra Character-3 talking-avatar overlay (V3), Family Plan, AR mode, Voice library, QR + physical print, AI chat with deceased (deliberate ethical line), native apps, free-roam exploration, outdoor scenes.

Full detail: see `.planning/research/FEATURES.md`.

### Architecture Approach

The architecture has one load-bearing decision: **port image-blaster's TypeScript orchestration into Inngest step functions** (NOT `child_process.spawn()` the CLI, NOT inline in a Next.js route). Every image-blaster dependency is already a remote HTTP API, so we lose no capability and gain native retries, step-level observability, real-time progress via `publish()` + `useInngestSubscription`, and webhook-driven resumption via `step.waitForEvent()`. Runtime flow: **Next.js (UI + thin API routes) → Inngest (job orchestration) → upstream AI APIs (Marble/FAL/ElevenLabs, each behind a Mock/Real adapter) → Vercel Blob (assets) → Postgres (state) → Three.js + Spark.js viewer (delivery).**

**Major components:**
1. **Upload UI (`app/create/`)** — `react-dropzone`, signed-URL client-direct upload to Vercel Blob, posts to `/api/scenes` which only inserts a row + sends an Inngest event
2. **Inngest orchestrator (`inngest/functions/scene-generate.ts`)** — 4-5 min pipeline as ~7 named `step.run()` blocks (submit-marble, wait-marble-done, detect-objects, mesh-N parallel, sfx, narration, publish); each step is a separate Vercel function invocation under the timeout cap
3. **Adapter layer (`lib/ai/{marble,fal,elevenlabs}.ts`)** — one file per upstream service exporting an interface; both `MockAdapter` and `RealAdapter` implement it; env flag `MOCK_MODE=true` swaps which is bound; THIS is the critical pattern for the mock-first constraint
4. **Webhook bridges (`app/api/webhooks/{stripe,fal,marble}/route.ts`)** — verify signature, persist event ID (idempotency), forward into Inngest as a typed event; return 200 in <1s
5. **Scene viewer (`app/scene/[slug]/`)** — server component does auth + payment gate via Drizzle query → renders dynamically-imported R3F Canvas (`ssr: false` mandatory) → Spark.js loads `.spz`, drei loads `.glb` meshes, `<PositionalAudio>` plays narration
6. **Persistence (`lib/db/schema.ts`)** — Drizzle on Neon Postgres: `scenes`, `voice_clones` (with `consent_artifact_url` FK enforced), `payments` (with `stripe_event_id UNIQUE`), `users`, `processed_webhook_events`
7. **Real-time progress** — `publish({channel: scene:${id}, ...})` from Inngest → `useInngestSubscription` hook → live phase markers
8. **Test harness** — Playwright e2e (full user flows in MOCK_MODE), Vitest unit (pure logic + adapter contract tests both Mock and Real must pass), accessibility tests, CI on every commit

Full detail: see `.planning/research/ARCHITECTURE.md`. Confidence HIGH.

### Critical Pitfalls

Top 5 of 12 critical items:

1. **Voice cloning without ironclad consent (legal landmine)** — Avoid via live-attestation recording for any voice that isn't the uploader's own (matched via ElevenLabs voiceprint check); store `consent_artifact_url` + `consent_transcript` + `consent_verified_at` as required FKs; IVC API call gated server-side. NEVER a checkbox. 2wai (40.9M views, dragged), May 2026 ElevenLabs Illinois lawsuit, California AB 1836 / AB 2602.
2. **Live demo of 5-min generation = certain death** — Pre-render 3 demo scenes before judging; record the canonical submission video; use MOCK_MODE for live patter so generation completes in <5s. NEVER demo a 5-min wait on shared venue wifi.
3. **Vercel function timeout kills generation midway** — NEVER run the pipeline in an API route. Always Inngest. Set `export const maxDuration = 800` on the Inngest serve route. Use `useInngestSubscription` for progress streaming.
4. **Stripe webhook double-charge / missed fulfillment** — `processed_webhook_events` table with `event_id UNIQUE`; `INSERT ... ON CONFLICT DO NOTHING`; verify `stripe-signature` with raw body; separate test/live signing secrets; return 200 in <1s, work async.
5. **iPhone Safari WebGL crash on 500K-gaussian splats** — LowPoly tier (10K polys + ~50K-gaussian `.spz`) via mobile UA detection; Canvas perf params (`dpr={[1,2]}`, `frameloop="demand"`, `gl={antialias: false, ...}`); test on REAL iPhone 12 (not simulator).

Plus: ElevenLabs credit burn (cap regen, cache MP3s by content hash), Hunyuan3D uncanny faces (person-detect + inpaint pre-pipeline), Marble waitlist (apply Day 0), R3F SSR hydration (`dynamic(..., {ssr: false})`), share-URL abuse (denylist + report + auto-nuke), API key juggling (Vercel env vars as source of truth, never commit `.env*`).

Full detail: see `.planning/research/PITFALLS.md`.

## Implications for Roadmap

Suggested 8-phase build. Mock-first adapter contract is established Phase 0 so every subsequent phase ships testable artifacts with zero API keys.

### Phase 0: Foundation, Adapter Contracts & Mock-First Infrastructure
**Rationale:** Mock-first is foundational, not polish. Define `Adapter` interfaces FIRST. Apply for World Labs / FAL / ElevenLabs / Stripe keys NOW (Pitfall #8).
**Delivers:** Repo scaffolded (Next.js 15.5 + pnpm + Tailwind v4.3 + shadcn/ui + Biome + Drizzle Kit + Vitest + Playwright); `lib/ai/{marble,fal,elevenlabs,stripe}.ts` interfaces + `MockAdapter` for each (deterministic seeded outputs); adapter contract tests; env-flag `MOCK_MODE=true` swap; Drizzle schema migrated; Inngest serve route + dev-server running; CI green.
**Avoids:** Pitfalls #8, #12; satisfies mock-first + testing-first constraints.

### Phase 1: Photo Upload + Scene Persistence + Auth (mock-mode)
**Rationale:** Entry point is concrete; proves Blob + Drizzle + Auth before AI integration.
**Delivers:** `/create` page with `react-dropzone`; signed-URL client-direct upload; `POST /api/scenes`; Clerk magic-link auth (or deferred); "My Memories" dashboard; Playwright e2e in MOCK_MODE.

### Phase 2: Inngest Pipeline Orchestration (mock adapters)
**Rationale:** Async job pattern must exist BEFORE any real API (Pitfall #3). Establishes the realtime progress UI.
**Delivers:** `inngest/functions/scene-generate.ts` wired to MockAdapter; `useInngestSubscription` realtime progress UI; webhook bridges; deterministic 5-second mock generation; Playwright e2e end-to-end.

### Phase 3: Three.js + Spark.js Viewer with Dummy SPZ
**Rationale:** Viewer is highest-risk client surface (SSR, mobile WebGL, R3F + React 19 compat) — build against committed fixture `.spz` so Phase 5 only swaps asset URL. Test real iPhone NOW.
**Delivers:** Server component with auth/payment gate → `dynamic({ssr:false})` viewer; `<SparkRenderer />` + `<SplatMesh />`; drei `<CameraControls />` walkable cone; `<PositionalAudio>` placeholder; Canvas perf params; LowPoly tier serving; Playwright Chromium + WebKit mobile; verified real iPhone 12 test.
**Avoids:** Pitfalls #7, #10.

### Phase 4: Voice Consent Gate + IVC + Narration Playback (mock-mode)
**Rationale:** Voice consent is BOTH feature and legal compliance gate (Pitfall #1). No IVC call reachable without attestation in DB.
**Delivers:** Live-attestation recording UI (`MediaRecorder` 15s); ElevenLabs voiceprint-match (mocked); `consent_artifact_url` + `consent_transcript` persisted; IVC API server-gated on `consentVerifiedAt IS NOT NULL`; cached narration MP3 by `hash(voiceId + text)`; spatial `<PositionalAudio>`; celebrity denylist (OFAC + Wikipedia top-10k); regen cap (3 attempts); Playwright happy + denied paths.
**Avoids:** Pitfalls #1, #5, #11.

### Phase 5: Stripe Checkout + Webhook + Payment Gate (mock + test mode)
**Rationale:** Payment authority is server-side; Phase 3 already gates viewer on `scene.paid`. Idempotency-from-day-1 (Pitfall #4).
**Delivers:** `POST /api/stripe/checkout` with `metadata.sceneId`; raw-body signature-verified webhook (`runtime: "nodejs"`) + `processed_webhook_events` idempotency; `checkout.session.completed` flips `scenes.paid=true`; emotional success modal; Stripe CLI replay rehearsal (duplicate-replay = ONE row); Playwright pay → unlock → view; Vitest signature + idempotency tests.
**Avoids:** Pitfalls #4, #12.

### Phase 6: Real-Adapter Swap & Live Integration
**Rationale:** With everything proven in MOCK_MODE, swap RealAdapter behind interfaces. Adapter contract tests catch shape drift.
**Delivers:** RealAdapter for World Labs Marble, FAL Hunyuan3D, ElevenLabs SFX + IVC, Stripe live test-mode; cost telemetry (`generationCostCents`); person-detection + lama-cleaner preprocessor before Hunyuan3D; rate-limit + 429 backoff; full real-pipeline rehearsal; pre-generated 3-5 demo scenes.
**Avoids:** Pitfalls #5, #6, #9.

### Phase 7: Share URL Polish + Mobile Hardening + Abuse Reporting
**Rationale:** Share URL is the viral mechanic; abuse reporting is the brand-protection floor.
**Delivers:** OG image per scene; social share modal with pre-built captions; "Report this scene" button + 1-h auto-nuke; ToS / AUP / DMCA agent contact; email-a-friend; verified iPhone 12 + Android Chrome + iOS Safari <3s on 4G; Lighthouse mobile audit; final accessibility tests.
**Avoids:** Pitfalls #11, #7.

### Phase 8: Demo Prep — Pre-Render, Video, Live Rehearsal
**Rationale:** Submission requires a video; live demos die (Pitfall #2).
**Delivers:** 60-second submission video; 3 pre-rendered fallback scenes; tested production deployment on demo machine; venue-wifi rehearsal; "demo failed → backup" patter; final cost reconciliation <$100; CI green.
**Avoids:** Pitfalls #2, #12.

### Phase Ordering Rationale

- Mock-first established Phase 0 = every later phase ships testable artifacts without keys (THE leverage point for testing-first policy)
- Upload (1) before pipeline (2) — concrete entry point proves Blob + Drizzle + Auth before orchestration risk
- Pipeline (2) before viewer (3) with mocks — progress UI must demo before viewer "ready" transition
- Viewer (3) before voice (4) — highest-risk client surface; failures here cost more later
- Voice (4) before payment (5) — consent gate is legal floor and must exist before any IVC call
- Real-adapter swap (6) is its own phase — budgets time for cost telemetry, person-inpainting, integration debugging
- Share polish (7) and demo prep (8) are deliberate phases — viral mechanic + judging artifact are the product

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (voice consent + IVC):** Live-attestation legal patterns vary by jurisdiction; ElevenLabs voiceprint-match endpoint + voice-captcha pattern needs concrete API research; person-detection denylist composition needs design.
- **Phase 6 (real-adapter swap):** Person-detection + inpainting choice (FAL face-detection vs yolov8; lama-cleaner vs InpaintAnything) under-researched; Marble vs Hunyuan-World-1.0 fallback architecture if Marble key delays.
- **Phase 7 (share-URL abuse):** DMCA agent registration logistics + AUP enforcement playbook need explicit policy decisions.

Standard patterns (skip dedicated research):
- **Phase 0, 1, 2, 3, 5, 8** — fully documented in STACK.md / ARCHITECTURE.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All major recommendations verified via npm + official vendor docs; version pins concrete |
| Features | HIGH | Cross-verified across MyHeritage, HereAfter, Luma, Polycam, Hedra, ElevenLabs, World Labs |
| Architecture | HIGH | Inngest + Vercel limits + R3F SSR + Stripe webhook are canonical; adapter-contract pattern is straightforward TypeScript |
| Pitfalls | HIGH | Voice ethics + Stripe + Vercel timeout + R3F SSR well-documented; MEDIUM on Hunyuan content edge cases |

**Overall confidence:** HIGH

### Gaps to Address

- **World Labs Marble API availability** — apply Day 0; Hunyuan World 1.0 on FAL as backup (4-6h pivot)
- **World Labs npm client maturity** — MockAdapter identical regardless; RealAdapter wraps `fetch()`
- **Hedra Character-3 timeline** — V3, out of hackathon scope; verify access before committing
- **Inngest free-tier 5-step concurrency** — throttle mesh-N to 3 concurrent; document paid-plan path
- **Person-detection preprocessor cost** — adds $0.05-0.10/scene; accept as cost of avoiding uncanny output
- **iOS Safari `.spz` memory thresholds** — device-class dependent; real-device testing mandatory
- **Voice consent legal sufficiency** — case law thin in 2026; consult counsel pre-launch beyond hackathon judging

## Sources

### Primary (HIGH confidence)
- Next.js 15.5 release notes, @react-three/fiber npm, Spark.js GitHub, @elevenlabs/elevenlabs-js npm, stripe-node CHANGELOG, Stripe Billing Meters API, @fal-ai/client docs, World Labs Marble docs, Vercel Function Limits + Fluid Compute, Vercel Blob, Tailwind v4.3, shadcn/ui Tailwind v4, Inngest Next.js docs, Clerk Next.js App Router, Drizzle ORM + Neon, ElevenLabs Sound Effects + IVC quickstart, Hedra Character-3 overview, image-blaster source repo
- ElevenLabs Voice Cloning consent docs, Stripe webhooks official, FAL Queue + webhooks, Hunyuan3D v2.1 on FAL, R3F `ssr:false` getting-started, Niantic SPZ format spec

### Secondary (MEDIUM confidence)
- LogRocket (auth 2026), Bytebase (Drizzle vs Prisma), BuildPilot (uploads + Trigger.dev vs Inngest), Polyvia3D (3DGS formats), competitor reviews (MyHeritage/HereAfter/Luma/Polycam/Hedra), Metronome 2026 AI Pricing, Hooklistener/HookRay/HookReplay webhook guides, Deepgram (ElevenLabs 2.8× real cost), Three.js iOS Safari WebGL crash reports

### Tertiary (LOW confidence — validate in Phase 6)
- World Labs Marble npm surface (may need fetch wrapper)
- Hunyuan3D content policy specifics (no official docs)
- Marble cost stability across hackathon period
- iOS Safari `.spz` memory thresholds

### Cautionary tales (HIGH confidence on outcomes)
- 2wai November 2025 backlash, ElevenLabs May 2026 Illinois lawsuit, Senator Hassan inquiry + FBI $893M voice scam report, California AB 1836 + AB 2602

---
*Research completed: 2026-05-15*
*Ready for roadmap: yes*
