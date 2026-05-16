# Living Photos — Roadmap

**Created:** 2026-05-15
**Granularity:** Coarse (8 phases — each a coherent ~3-6h deliverable)
**Parallelization:** Enabled
**Core Value:** A person can step inside a photograph that matters to them and hear someone they loved speak from inside it — within five minutes of upload, for under $20.

## Phases

- [ ] **Phase 1: Foundation, Adapter Contracts & Mock-First Infrastructure** — Repo scaffolded with Next.js 15.5 + Drizzle + Inngest + CI; all paid APIs wrapped behind Mock/Real adapter interfaces; `MOCK_MODE=true` runs end-to-end with zero keys.
- [ ] **Phase 2: Photo Upload + Scene Persistence + Auth** — Users drag-drop a photo, get a `scenes` row persisted, and see their memories in a dashboard; anonymous + authenticated flows both work in MOCK_MODE.
- [ ] **Phase 3: Inngest Pipeline Orchestration (Mock Adapters)** — Full 7-step generation pipeline runs under Inngest with realtime progress streaming to the UI; deterministic <10s mock completion; webhook resumption pattern proven.
- [ ] **Phase 4: Three.js + Spark.js Viewer** — Server-component-gated, dynamically imported R3F Canvas renders `.spz` splat + meshes + positional audio; walkable cone controls work on desktop and mobile Safari (real iPhone 12+ verified); LowPoly tier serves correctly.
- [ ] **Phase 5: Voice Consent Gate + IVC + Narration Playback** — Live-attestation recording is the legal floor; no IVC API call is reachable without `consent_verified_at` set; cached narration plays as ambient `<PositionalAudio>` in-scene; celebrity denylist enforced.
- [ ] **Phase 6: Stripe Checkout + Webhook + Payment Gate** — `/scene/[slug]` server-gates viewer on `scene.paid`; raw-body signature-verified webhook with `processed_webhook_events` idempotency; Stripe CLI replay produces exactly one row mutation; emotional success modal unlocks viewer.
- [ ] **Phase 7: Real-Adapter Swap & Live Integration** — `MOCK_MODE=false` runs the real pipeline end-to-end within 6 minutes for a typical interior photo; cost telemetry surfaces `generationCostCents` per scene; person-detection + inpaint preprocessor avoids uncanny meshes; 3-5 demo scenes pre-rendered.
- [ ] **Phase 8: Share Polish + Mobile Hardening + Abuse Reporting** — Every paid scene has a public `/s/[slug]` URL with OG preview image, social share captions, "Report this scene" auto-nuke, and verified <3s mobile-Safari load on 4G; ToS/AUP/DMCA published.
- [ ] **Phase 9: Demo Prep — Pre-Render, Video, Live Rehearsal** — 60-second submission video recorded; venue-WiFi rehearsal complete; pre-rendered fallback scenes ready; submission checklist (@stripe + @elevenlabsio + #ElevenHacks) satisfied; CI green; ≥50 test cases passing.

## Phase Details

### Phase 1: Foundation, Adapter Contracts & Mock-First Infrastructure
**Goal**: Establish the mock-first foundation so every subsequent phase ships testable artifacts without burning API credits.
**Depends on**: Nothing (foundation phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05, FND-06, FND-07, FND-08, FND-09
**Success Criteria** (what must be TRUE):
  1. Developer can clone the repo, run `pnpm install && pnpm dev`, and reach a working Next.js app at `localhost:3000` with no API keys configured
  2. Setting `MOCK_MODE=true` causes every paid-API adapter (Marble, FAL, ElevenLabs, Stripe) to return deterministic mock outputs; setting `MOCK_MODE=false` swaps to real adapters via env flag with zero code change
  3. CI pipeline (lint + typecheck + Vitest + Playwright) runs green on every push; adapter contract tests confirm Mock and Real adapters satisfy the same TypeScript interface
  4. Drizzle schema is migrated against Neon Postgres; Inngest dev server runs alongside Next.js and `/api/inngest` is reachable
  5. `.env.example` documents every required env var for both mock and real modes; Sentry + PostHog are wired (no-op in dev)
**Plans**: TBD

### Phase 2: Photo Upload + Scene Persistence + Auth
**Goal**: User can drop a photo on `/create`, give it a title, and watch a `scenes` row appear in their dashboard — entirely in MOCK_MODE.
**Depends on**: Phase 1
**Requirements**: UPL-01, UPL-02, UPL-03, UPL-04, UPL-05, UPL-06, REL-01 (initial e2e scaffold), REL-03 (upload unit tests), REL-05 (a11y on upload page)
**Success Criteria** (what must be TRUE):
  1. User can drag-drop or select a JPEG/PNG/WEBP up to 25MB on `/create` and see a preview
  2. Photo uploads directly to Vercel Blob via signed URL without round-tripping through the server (no 4.5MB limit hit)
  3. After upload, a `scenes` row exists with status `pending` and an Inngest event has been published
  4. Authenticated users see their scenes in a "My Memories" dashboard at `/dashboard`; anonymous users can still create and their scenes are later claimable via magic link from Stripe Checkout email
  5. Playwright e2e covers the full upload flow in MOCK_MODE and runs in CI; axe-core accessibility tests pass on `/create`
**Plans**: TBD

### Phase 3: Inngest Pipeline Orchestration (Mock Adapters)
**Goal**: A photo upload triggers a 7-step Inngest pipeline that completes in <10s with mocks and reports realtime progress to the UI — the async-job pattern is proven before any real API touches it.
**Depends on**: Phase 2
**Requirements**: PIP-01, PIP-02, PIP-03, PIP-04, PIP-05, REL-04 (adapter contract drift detection), REL-08 (containerized e2e harness)
**Success Criteria** (what must be TRUE):
  1. The `scene-generate` Inngest function decomposes the pipeline into named `step.run()` blocks (submit-marble, wait-marble-done, detect-objects, mesh-objects, generate-sfx, generate-narration, publish) and each step is independently retryable
  2. Pipeline progress publishes to a per-scene realtime channel and the UI consumes it via `useInngestSubscription`, showing live phase markers
  3. Webhook bridges at `/api/webhooks/{marble,fal}` translate upstream completions into Inngest events; `step.waitForEvent()` resumes the pipeline correctly
  4. In `MOCK_MODE=true`, the full pipeline completes end-to-end in ≤10 seconds with pre-canned fixture assets (`.spz`, `.glb`, `.mp3`)
  5. Playwright e2e covers the full upload → generate → ready transition in MOCK_MODE; `pnpm test:e2e` boots containerized Inngest + Postgres locally
**Plans**: TBD

### Phase 4: Three.js + Spark.js Viewer
**Goal**: A paid, ready scene renders as a walkable 3D environment at `/scene/[slug]` on both desktop and a real iPhone 12+, with no SSR crashes and no Safari WebGL freezes.
**Depends on**: Phase 3 (needs ready scene with fixture `.spz`)
**Requirements**: VWR-01, VWR-02, VWR-03, VWR-04, VWR-05, VWR-06, VWR-08, VWR-09, VWR-10, REL-02 (Chromium + WebKit mobile viewports), REL-05 (a11y on viewer page)
**Success Criteria** (what must be TRUE):
  1. `/scene/[slug]` is a server component that auth-and-payment-gates access; the viewer Canvas is dynamically imported with `{ ssr: false }` so no Three.js code ever runs in Node
  2. Spark.js `<SparkRenderer />` + `<SplatMesh />` load and render the scene's `.spz`; drei `<CameraControls />` provides walkable-cone navigation (mouse + WASD desktop, touch joystick mobile)
  3. Mobile UA detection serves the LowPoly tier (≤50K gaussians + ≤10K poly meshes); ambient SFX plays via Three.js `<PositionalAudio>` with listener-position attenuation
  4. Initial viewer load is <3s on a throttled 4G Lighthouse mobile audit; the viewer has been opened and tested on a real iPhone 12+ (not simulator) with no Safari crash
  5. When WebGL2 is unavailable, the viewer gracefully degrades to a "view on desktop" fallback message instead of a blank canvas
**Plans**: TBD

### Phase 5: Voice Consent Gate + IVC + Narration Playback
**Goal**: No IVC API call is reachable without a verifiable live-attestation artifact, narration plays in 3D space, and celebrities are denylisted — voice consent is wired as the legal floor, not bolted on.
**Depends on**: Phase 4 (narration plays inside the viewer)
**Requirements**: VOC-01, VOC-02, VOC-03, VOC-04, VOC-05, VOC-06, VOC-07, VOC-08, VOC-09, VOC-10, VWR-07 (narration playback in viewer), REL-03 (consent-gate unit tests)
**Success Criteria** (what must be TRUE):
  1. User can record a 15-second live-attestation video via `MediaRecorder`; the required transcript includes the consent statement + a unique nonce; the `consent_artifact_url` and `consent_transcript` are persisted to Vercel Blob and the `voice_clones` row before any IVC call
  2. Server-side gate is enforced: no IVC API call is reachable unless `voice_clones.consent_verified_at IS NOT NULL` for that voice; voices that don't match the uploader's voiceprint require the named third party to be present in the recording
  3. Narration MP3 is cached by `hash(voiceId + text)` so the same audio is never regenerated twice; hard cap of 3 regenerations per voice clone per scene
  4. Generated narration plays inside the 3D scene as positional audio softly as the user enters; celebrity / public-figure denylist (cached OFAC + Wikipedia top-10k) blocks IVC for known voices
  5. User can revoke a voice clone from `/dashboard` — server-side delete + ElevenLabs voice deletion + asset blob purge all complete; Playwright covers both happy and denied paths
**Plans**: TBD

### Phase 6: Stripe Checkout + Webhook + Payment Gate
**Goal**: A user can pay $19 via Stripe Checkout to unlock a scene; idempotency is enforced from day one and the Stripe CLI can replay the webhook three times producing exactly one row mutation.
**Depends on**: Phase 4 (viewer gates on `scene.paid`)
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08, PAY-09, REL-03 (webhook idempotency + signature unit tests)
**Success Criteria** (what must be TRUE):
  1. User clicks "Unlock memory ($19)" on a generated scene and is redirected to a Stripe Checkout hosted page with `metadata.sceneId` + `metadata.userId`; Apple Pay + Google Pay are enabled where supported
  2. The `/api/webhooks/stripe` route runs on Node runtime, verifies the `stripe-signature` header against the raw body, and writes to a `processed_webhook_events` table with a unique `event_id` constraint — replaying the same webhook 3x via Stripe CLI produces exactly one row mutation
  3. On `checkout.session.completed`, `scenes.paid` flips to `true` and a confirmation email is sent; user is redirected to an "emotional success modal" and the scene viewer unlocks immediately
  4. Test mode + Mock mode are both wired and selected by env flag; production stays in test-mode-only for the hackathon submission
  5. Every paid scene has `generationCostCents` recorded so gross margin is observable per scene; Vitest unit tests cover signature verification, idempotency, and the `paid → unlock` transition
**Plans**: TBD

### Phase 7: Real-Adapter Swap & Live Integration
**Goal**: Flipping `MOCK_MODE=false` runs the real pipeline end-to-end in ≤6 minutes for a typical interior photo, costing <$3.50 in API spend, with no uncanny faces and no surprise rate limits.
**Depends on**: Phase 6 (full mock-mode loop must work first)
**Requirements**: PIP-06, PIP-07, DEM-02 (3-5 pre-rendered fallback scenes), REL-04 (real-adapter contract parity confirmed), REL-06 (≥50 test cases milestone), REL-07 (CI fails on any error)
**Success Criteria** (what must be TRUE):
  1. RealAdapter is wired for World Labs Marble, FAL Hunyuan3D, ElevenLabs SFX + IVC, and Stripe live test-mode; adapter contract tests confirm shape parity with MockAdapter
  2. In `MOCK_MODE=false`, the pipeline completes within 6 minutes (4-5 min target + 1 min slack) for a typical interior photo; cost telemetry writes `generationCostCents` into the `scenes` row for every step
  3. A person-detection + lama-cleaner preprocessor runs before Hunyuan3D so source photos with people produce clean meshes (no uncanny extruded faces); rate-limit + 429 exponential backoff is wired across all upstream calls
  4. 3-5 demo scenes are pre-generated, stored at stable share URLs, and verified to load fast and look great on real devices
  5. At least 50 `test()` cases exist across Vitest + Playwright; CI fails the build on any lint, typecheck, unit, or e2e error
**Plans**: TBD

### Phase 8: Share Polish + Mobile Hardening + Abuse Reporting
**Goal**: Every paid scene becomes a viral-ready public URL with a beautiful OG preview, social share captions, mobile-Safari hardness, and a brand-protection floor of abuse reporting + ToS.
**Depends on**: Phase 7 (real scenes exist to share)
**Requirements**: SHR-01, SHR-02, SHR-03, SHR-04, SHR-05, SHR-06
**Success Criteria** (what must be TRUE):
  1. Every paid scene has a public `/s/[slug]` URL viewable without authentication; `@vercel/og` server-renders a custom preview image per scene from the source photo + scene title for `<meta>` + `og:` tags
  2. A "Share" modal offers one-tap copy + pre-built captions for X, TikTok, Instagram; share URLs are unfurl-tested on Twitter/X, iMessage, and WhatsApp
  3. Every share page surfaces a "Report this scene" button wired to a 1-hour auto-nuke pathway for abuse triage
  4. Public Terms of Service, Acceptable Use Policy, and DMCA agent contact are linked in the footer and reachable
  5. Mobile-Safari rendering is verified on real iPhone 12+ AND Android Chrome; viewer initial load is <3s on a throttled 4G Lighthouse audit; final accessibility tests pass on upload, viewer, and share modal
**Plans**: TBD

### Phase 9: Demo Prep — Pre-Render, Video, Live Rehearsal
**Goal**: Hackathon submission is locked: the 60-second video is recorded, fallback scenes exist, the venue-WiFi rehearsal succeeded, and the submission checklist is complete.
**Depends on**: Phase 8 (final product ready to demo)
**Requirements**: DEM-01, DEM-03, DEM-04, DEM-05, REL-06 (final ≥50 test cases gate)
**Success Criteria** (what must be TRUE):
  1. A 60-second submission video is recorded, edited, and saved at `/public/demo/submission.mp4` showing the magic moment (upload → splat building → walk in → cloned voice → share)
  2. Production deployment on Vercel preview is reachable and has been tested at the venue WiFi (not just home network) before the submission deadline
  3. Live-demo script + backup-if-fails patter is rehearsed end-to-end and documented in `/docs/demo.md`; the team has practiced the "demo failed → switch to backup" pivot
  4. Submission checklist is satisfied: `@stripe` + `@elevenlabsio` + `#ElevenHacks` tagged on the submission
  5. Final CI run is green; total test count is ≥50; cost reconciliation shows <$100 in API spend across the entire build
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, Adapter Contracts & Mock-First Infrastructure | 0/0 | Not started | - |
| 2. Photo Upload + Scene Persistence + Auth | 0/0 | Not started | - |
| 3. Inngest Pipeline Orchestration (Mock Adapters) | 0/0 | Not started | - |
| 4. Three.js + Spark.js Viewer | 0/0 | Not started | - |
| 5. Voice Consent Gate + IVC + Narration Playback | 0/0 | Not started | - |
| 6. Stripe Checkout + Webhook + Payment Gate | 0/0 | Not started | - |
| 7. Real-Adapter Swap & Live Integration | 0/0 | Not started | - |
| 8. Share Polish + Mobile Hardening + Abuse Reporting | 0/0 | Not started | - |
| 9. Demo Prep — Pre-Render, Video, Live Rehearsal | 0/0 | Not started | - |

## Coverage

**v1 requirements:** 51 total
**Mapped:** 51 ✓
**Orphaned:** 0

### Cross-Cutting REL-* Distribution

Reliability & Tests requirements are intentionally distributed — each phase ships its own testing scope; final completion lands in Phase 9.

| REL-ID | Description | Lands in Phase |
|--------|-------------|----------------|
| REL-01 | Playwright happy-path e2e in MOCK_MODE ≤2min | Phase 2 (scaffold) → completed Phase 3 (full pipeline) |
| REL-02 | Chromium desktop + WebKit mobile viewports | Phase 4 |
| REL-03 | Vitest unit tests (adapters, consent, idempotency, cost) | Phase 2 (upload) + Phase 5 (consent) + Phase 6 (webhook) |
| REL-04 | Adapter contract tests Mock vs Real | Phase 3 (Mock parity) → completed Phase 7 (Real parity) |
| REL-05 | Accessibility tests (axe-core / Playwright a11y) | Phase 2 (upload) + Phase 4 (viewer) + Phase 8 (share modal) |
| REL-06 | ≥50 `test()` cases total | Phase 7 (initial milestone) + Phase 9 (final gate) |
| REL-07 | CI fails on lint/typecheck/unit/e2e errors | Phase 7 (final enforcement) |
| REL-08 | `pnpm test:e2e` boots containerized Inngest + Postgres locally | Phase 3 |

### DEM-02 Note

DEM-02 ("3-5 pre-rendered fallback scenes") lands in Phase 7 because the real adapters must exist before scenes can be pre-rendered. Phase 9 verifies these scenes still load correctly on the demo machine at venue WiFi.

## Phase Ordering Rationale

1. **Phase 1 (Foundation)** establishes mock-first adapter contracts FIRST — every later phase depends on this for testable artifacts with zero API keys.
2. **Phase 2 (Upload)** before pipeline — concrete entry point proves Blob + Drizzle + Auth before async orchestration risk.
3. **Phase 3 (Pipeline)** with mocks before viewer — progress UI must demo before viewer "ready" transition; async-job pattern proven before real APIs.
4. **Phase 4 (Viewer)** before voice — highest-risk client surface (SSR, mobile WebGL, R3F + React 19 compat); failures here cost more later.
5. **Phase 5 (Voice)** before payment — consent gate is the legal floor and must exist before any IVC call is reachable.
6. **Phase 6 (Payment)** before real-adapter swap — viewer must gate on `scene.paid` first; idempotency wired from day one.
7. **Phase 7 (Real-Adapter Swap)** is its own phase — budgets time for cost telemetry, person-inpainting, integration debugging, demo-scene pre-rendering.
8. **Phase 8 (Share Polish)** after real scenes exist — viral mechanic + brand-protection floor live on real content.
9. **Phase 9 (Demo Prep)** is deliberate — judging artifact is the product.

---
*Roadmap created: 2026-05-15*
