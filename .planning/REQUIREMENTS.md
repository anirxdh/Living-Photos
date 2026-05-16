# Requirements: Living Photos

**Defined:** 2026-05-15
**Core Value:** A person can step inside a photograph that matters to them and hear someone they loved speak from inside it — within five minutes of upload, for under $20.

## v1 Requirements

Requirements for hackathon-shippable release. Each maps to a roadmap phase. All requirements must be satisfied in `MOCK_MODE=true` (no API keys required) AND in `MOCK_MODE=false` (real APIs).

### Foundation

- [ ] **FND-01**: Repo runs `pnpm dev` cleanly on Next.js 15.5 + React 19 + TS strict mode + Tailwind v4.3 + shadcn/ui
- [ ] **FND-02**: Every paid upstream API (Marble, FAL, ElevenLabs, Stripe) is wrapped behind an `Adapter` interface with both a `MockAdapter` and a `RealAdapter` implementation
- [ ] **FND-03**: Environment flag `MOCK_MODE=true` causes the entire pipeline to run end-to-end with deterministic mock outputs (no network calls to paid services)
- [ ] **FND-04**: Drizzle schema is created and migrated for `scenes`, `voice_clones`, `payments`, `users`, `processed_webhook_events` tables (Neon Postgres)
- [ ] **FND-05**: CI pipeline runs Biome lint, TypeScript typecheck, Vitest unit tests, and Playwright e2e on every push
- [ ] **FND-06**: Vitest adapter-contract tests verify Mock and Real adapters satisfy the same interface shape
- [ ] **FND-07**: Inngest dev server runs alongside Next.js dev server; serve route at `/api/inngest` is reachable
- [ ] **FND-08**: `.env.example` documents all required env vars for both mock and real modes
- [ ] **FND-09**: Sentry + PostHog are wired (no-op in dev, active in production preview deploys)

### Upload

- [ ] **UPL-01**: User can drag-drop or select a photo on `/create` page (JPEG/PNG/WEBP, max 25MB)
- [ ] **UPL-02**: Photo uploads directly to Vercel Blob via signed URL (no server round-trip for the file payload)
- [ ] **UPL-03**: After successful upload, a `scenes` row is created with status `pending` and an Inngest event is published
- [ ] **UPL-04**: User can give the scene a title and description before submitting
- [ ] **UPL-05**: Authenticated users see their scenes in a "My Memories" dashboard at `/dashboard`
- [ ] **UPL-06**: Anonymous users can create scenes; email is captured at Stripe Checkout and later claimable via magic-link

### Pipeline

- [ ] **PIP-01**: An Inngest function `scene-generate` orchestrates the full pipeline as named `step.run()` blocks (submit-marble, wait-marble-done, detect-objects, mesh-objects, generate-sfx, generate-narration, publish)
- [ ] **PIP-02**: Each step is independently retryable with exponential backoff (Inngest defaults)
- [ ] **PIP-03**: Pipeline progress is published to a per-scene realtime channel and consumed by the UI via `useInngestSubscription`
- [ ] **PIP-04**: Pipeline supports webhook resumption via `step.waitForEvent()` for upstream services (Marble + FAL both webhook-capable)
- [ ] **PIP-05**: In `MOCK_MODE=true` the full pipeline completes in ≤10 seconds with pre-canned fixture assets
- [ ] **PIP-06**: In `MOCK_MODE=false` the pipeline completes within 6 minutes (4-5 min target + 1 min slack) for a typical interior photo
- [ ] **PIP-07**: Each step emits cost telemetry (`generationCostCents`) into the `scenes` row

### Viewer

- [ ] **VWR-01**: `/scene/[slug]` route renders a server component that auth-and-payment-gates access to the viewer
- [ ] **VWR-02**: Viewer Canvas is dynamically imported with `{ ssr: false }` (no SSR hydration of Three.js)
- [ ] **VWR-03**: Spark.js `<SparkRenderer />` + `<SplatMesh />` load and render the scene's `.spz` Gaussian splat
- [ ] **VWR-04**: drei `<CameraControls />` provides a "walkable cone" navigation — mouse + WASD on desktop, touch-joystick on mobile
- [ ] **VWR-05**: Viewer detects mobile UA and serves a LowPoly tier (≤50k gaussians + ≤10k poly meshes) to prevent iPhone Safari WebGL crashes
- [ ] **VWR-06**: Viewer plays ambient SFX via Three.js `<PositionalAudio>` looped, attenuated by listener position
- [ ] **VWR-07**: If a voice clone exists, narration audio plays softly as the user enters the scene (also `<PositionalAudio>`)
- [ ] **VWR-08**: Viewer initial load is <3s on a throttled 4G connection (Lighthouse mobile audit gate)
- [ ] **VWR-09**: Viewer is verified working on real iPhone 12+ (Mobile Safari) — NOT just simulator
- [ ] **VWR-10**: Viewer gracefully degrades when WebGL2 is unavailable (show a fallback "view on desktop" message)

### Voice

- [ ] **VOC-01**: User can record a 15-second live-attestation video via browser `MediaRecorder` API
- [ ] **VOC-02**: Attestation transcript is required; user reads a generated phrase that includes the consent statement + a unique nonce
- [ ] **VOC-03**: Server-side gate: no IVC API call is reachable unless `voice_clones.consent_verified_at IS NOT NULL` for that voice
- [ ] **VOC-04**: A `consent_artifact_url` (Vercel Blob link to the attestation recording) and `consent_transcript` are persisted before any clone is created
- [ ] **VOC-05**: For voices that don't match the uploader's voiceprint, the attestation flow requires the named third party to be present in the recording
- [ ] **VOC-06**: Celebrity / public-figure denylist blocks IVC for known voices (cached OFAC + Wikipedia top-10k subset; documented update procedure)
- [ ] **VOC-07**: Narration MP3 is cached by `hash(voiceId + text)` — never regenerate the same audio twice
- [ ] **VOC-08**: Hard cap of 3 regenerations per voice clone per scene before requiring user confirmation
- [ ] **VOC-09**: Generated narration plays inside the 3D scene as positional audio (Phase 4 cross-deliverable with Viewer)
- [ ] **VOC-10**: User can revoke a voice clone from `/dashboard` — server-side delete + ElevenLabs voice deletion + asset blob purge

### Payment

- [ ] **PAY-01**: User clicks "Unlock memory ($19)" on a generated scene → server creates a Stripe Checkout session with `metadata.sceneId` and `metadata.userId`
- [ ] **PAY-02**: Stripe Checkout is the official hosted page; Apple Pay + Google Pay are enabled where supported
- [ ] **PAY-03**: Stripe webhook endpoint at `/api/webhooks/stripe` (Node runtime) verifies signatures with raw body
- [ ] **PAY-04**: A `processed_webhook_events` table with `event_id UNIQUE` constraint enforces idempotency
- [ ] **PAY-05**: On `checkout.session.completed`, the matching `scenes.paid` flips to `true` and a confirmation email is sent
- [ ] **PAY-06**: User is redirected to an "emotional success modal" on return from Checkout — scene viewer unlocks immediately
- [ ] **PAY-07**: Stripe CLI replay test verifies that double-firing the same webhook produces exactly one row mutation
- [ ] **PAY-08**: Test mode + Mock mode are wired; production goes live in test-mode only for the hackathon submission
- [ ] **PAY-09**: Cost ledger: every paid scene has `generationCostCents` and gross margin is observable per scene

### Share

- [ ] **SHR-01**: Every paid scene has a public `/s/[slug]` URL viewable without authentication
- [ ] **SHR-02**: `<meta>` and `og:` tags render a custom preview image for each scene (server-rendered via `@vercel/og` from the source photo + scene title)
- [ ] **SHR-03**: A "Share" modal offers one-tap copy + pre-built captions for X, TikTok, Instagram
- [ ] **SHR-04**: Share URL is open-graphable and unfurl-tested on Twitter/X, iMessage, WhatsApp
- [ ] **SHR-05**: "Report this scene" button + 1-hour auto-nuke pathway for abuse triage
- [ ] **SHR-06**: Public Terms of Service, Acceptable Use Policy, and DMCA contact are linked in footer

### Reliability & Tests

- [ ] **REL-01**: Playwright e2e suite covers the full happy path in MOCK_MODE (upload → generate → view → unlock → share) — runs in ≤2 minutes total
- [ ] **REL-02**: Playwright tests Chromium desktop + WebKit mobile viewports
- [ ] **REL-03**: Vitest unit tests cover all adapter implementations, the consent gate logic, the webhook idempotency, and the cost-telemetry computations
- [ ] **REL-04**: Adapter contract tests run against both Mock and Real (skipped if keys absent) and assert shape parity
- [ ] **REL-05**: Accessibility tests (axe-core or Playwright's `@playwright/test` accessibility helpers) cover the upload, viewer, and share modal pages
- [ ] **REL-06**: At least 50 individual `test()` cases exist across Vitest + Playwright when phase 8 lands
- [ ] **REL-07**: CI fails on lint, typecheck, unit, or e2e errors
- [ ] **REL-08**: `pnpm test:e2e` runs a containerized Inngest + Postgres locally with `MOCK_MODE=true`

### Demo

- [ ] **DEM-01**: 60-second submission video is recorded, edited, and saved at `/public/demo/submission.mp4`
- [ ] **DEM-02**: 3-5 pre-rendered fallback scenes are published with stable share URLs that work without re-generation
- [ ] **DEM-03**: Production deployment on Vercel preview is reachable and tested at the venue Wi-Fi
- [ ] **DEM-04**: Live-demo script + backup-if-fails patter is rehearsed and documented in `/docs/demo.md`
- [ ] **DEM-05**: Submission checklist (tag @stripe + @elevenlabsio + #ElevenHacks) is satisfied

## v2 Requirements

Deferred to post-hackathon week 1-2 milestone.

### Differentiators
- **MP4-01**: Server-side 15-second cinematic MP4 demo-reel auto-generation from each scene (headless Three.js → ffmpeg pipeline)
- **SUB-01**: Subscription tier ($49/yr unlimited) via Stripe Billing Meters + a metered Price
- **SUB-02**: Lifetime $299 plan
- **MEM-01**: "Memory Letter" — text → cloned-voice TTS sent as a delivered audio file
- **GAL-01**: Public opt-in gallery of memorable scenes (curated)

### Multi-photo Stitching (V2)
- **MUL-01**: User can upload 2-6 photos of the same place and the pipeline stitches them into a single fuller scene
- **MUL-02**: Pipeline detects spatial overlap and composes the splats with shared coordinates
- **MUL-03**: UI lets the user place each photo on a rough floor plan to help the stitcher

### Hedra Talking Avatars (V3)
- **AVT-01**: Pipeline pre-processes the photo with person-detection + lama-cleaner inpainting (removes the people from the background plate)
- **AVT-02**: Detected people are re-introduced as Hedra Character-3 talking avatars overlaid at their original positions in the 3D scene
- **AVT-03**: Each avatar speaks the cloned voice in real-time when the user approaches (proximity-triggered)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile apps (iOS/Android) | Hackathon scope; share URLs work on phone Safari/Chrome |
| Free-roam open-world exploration | Image-blaster splats hallucinate from extreme angles — walkable cone only |
| In-scene editing (move objects, repaint walls) | Gaussian splats aren't normal meshes; out of scope for v1 |
| Outdoor wide-open scenes (beach, fields) | Marble underperforms there; we focus on interior scenes for marketing |
| Voice cloning of public figures, celebrities, or non-consenting parties | Hard ethical/legal line; non-negotiable |
| AI chat / "talk to the deceased" conversational mode | Ethical line (2wai precedent) — narration only, not interactive dialogue |
| Real-time multiplayer scene exploration | Complexity vs hackathon value too low |
| User-generated marketplace / Stripe Connect | Pivot away from hackathon focus |
| AR mode / WebXR | Phase 1 viewer is enough; AR is future work |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Pending |
| FND-02 | Phase 1 | Pending |
| FND-03 | Phase 1 | Pending |
| FND-04 | Phase 1 | Pending |
| FND-05 | Phase 1 | Pending |
| FND-06 | Phase 1 | Pending |
| FND-07 | Phase 1 | Pending |
| FND-08 | Phase 1 | Pending |
| FND-09 | Phase 1 | Pending |
| UPL-01 | Phase 2 | Pending |
| UPL-02 | Phase 2 | Pending |
| UPL-03 | Phase 2 | Pending |
| UPL-04 | Phase 2 | Pending |
| UPL-05 | Phase 2 | Pending |
| UPL-06 | Phase 2 | Pending |
| PIP-01 | Phase 3 | Pending |
| PIP-02 | Phase 3 | Pending |
| PIP-03 | Phase 3 | Pending |
| PIP-04 | Phase 3 | Pending |
| PIP-05 | Phase 3 | Pending |
| PIP-06 | Phase 7 | Pending |
| PIP-07 | Phase 7 | Pending |
| VWR-01 | Phase 4 | Pending |
| VWR-02 | Phase 4 | Pending |
| VWR-03 | Phase 4 | Pending |
| VWR-04 | Phase 4 | Pending |
| VWR-05 | Phase 4 | Pending |
| VWR-06 | Phase 4 | Pending |
| VWR-07 | Phase 5 | Pending |
| VWR-08 | Phase 4 | Pending |
| VWR-09 | Phase 4 | Pending |
| VWR-10 | Phase 4 | Pending |
| VOC-01 | Phase 5 | Pending |
| VOC-02 | Phase 5 | Pending |
| VOC-03 | Phase 5 | Pending |
| VOC-04 | Phase 5 | Pending |
| VOC-05 | Phase 5 | Pending |
| VOC-06 | Phase 5 | Pending |
| VOC-07 | Phase 5 | Pending |
| VOC-08 | Phase 5 | Pending |
| VOC-09 | Phase 5 | Pending |
| VOC-10 | Phase 5 | Pending |
| PAY-01 | Phase 6 | Pending |
| PAY-02 | Phase 6 | Pending |
| PAY-03 | Phase 6 | Pending |
| PAY-04 | Phase 6 | Pending |
| PAY-05 | Phase 6 | Pending |
| PAY-06 | Phase 6 | Pending |
| PAY-07 | Phase 6 | Pending |
| PAY-08 | Phase 6 | Pending |
| PAY-09 | Phase 6 | Pending |
| SHR-01 | Phase 8 | Pending |
| SHR-02 | Phase 8 | Pending |
| SHR-03 | Phase 8 | Pending |
| SHR-04 | Phase 8 | Pending |
| SHR-05 | Phase 8 | Pending |
| SHR-06 | Phase 8 | Pending |
| REL-01 | Phase 2 / Phase 3 | Pending |
| REL-02 | Phase 4 | Pending |
| REL-03 | Phase 2 / Phase 5 / Phase 6 | Pending |
| REL-04 | Phase 3 / Phase 7 | Pending |
| REL-05 | Phase 2 / Phase 4 / Phase 8 | Pending |
| REL-06 | Phase 7 / Phase 9 | Pending |
| REL-07 | Phase 7 | Pending |
| REL-08 | Phase 3 | Pending |
| DEM-01 | Phase 9 | Pending |
| DEM-02 | Phase 7 | Pending |
| DEM-03 | Phase 9 | Pending |
| DEM-04 | Phase 9 | Pending |
| DEM-05 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 51 total
- Mapped to phases: 51 (100%) ✓
- Unmapped: 0

### Coverage Notes

- **REL-* (Reliability & Tests) requirements span multiple phases** by design — each phase ships its own testing scope. The "primary phase" column shows where the requirement is first introduced; the "final completion" gate is the latest phase listed.
- **VWR-07 (narration in viewer)** lands in Phase 5 (Voice) rather than Phase 4 (Viewer) because narration audio depends on a completed voice clone, which Phase 5 produces. The viewer's `<PositionalAudio>` infrastructure for ambient SFX (VWR-06) is in Phase 4; VWR-07 plugs voice into the same primitives in Phase 5.
- **PIP-06 + PIP-07 (real-mode pipeline + cost telemetry)** are in Phase 7 (Real-Adapter Swap), not Phase 3 (Pipeline Orchestration). Phase 3 establishes the orchestration pattern with mocks; Phase 7 swaps in real adapters and turns on cost telemetry.
- **DEM-02 (3-5 pre-rendered scenes)** is in Phase 7, not Phase 9, because pre-rendering requires real adapters to be live. Phase 9 verifies these scenes load correctly on the demo machine.

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after roadmap traceability mapping*
