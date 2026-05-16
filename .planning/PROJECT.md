# Living Photos

## What This Is

Living Photos turns an old photograph into a walkable 3D scene you can step into and explore in your browser, with the voices of the people who were there. Upload one photo (e.g., grandma's living room, your childhood bedroom, your wedding day) — five minutes later, you have a shareable URL where you can mouse-walk through the space, with a cloned voice of a loved one playing as ambient narration. The product is built for anyone who wants to revisit a moment they can't physically return to: families preserving the spaces of relatives who've passed, people far from home, parents archiving the rooms their kids grew up in.

## Core Value

A person can step inside a photograph that matters to them and hear someone they loved speak from inside it — within five minutes of upload, for under $20.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can upload a single photo and get a walkable 3D scene rendered in their browser within ~5 minutes
- [ ] User can optionally upload a 30-second voice sample and have it cloned (with consent) to play as ambient narration in the scene
- [ ] User can share the resulting scene as a URL that opens in any modern mobile or desktop browser (no app install)
- [ ] User can pay via Stripe Checkout for a generation (one-time) or subscribe for unlimited (recurring)
- [ ] User can upload multiple photos of the same place and get a single fuller 3D scene that stitches the perspectives (V2)
- [ ] User can have a person in the photo brought to life as a talking animated avatar inside the 3D scene via Hedra Character-3 (V3)
- [ ] System enforces consent for any cloned voice that isn't the uploader's own (live verification recording)
- [ ] System renders an MP4 "demo reel" of the scene (15s cinematic walkthrough) suitable for sharing on social

### Out of Scope

- Native mobile apps (iOS/Android) — web-first, every scene is a URL that works on phone Safari
- True free-roam open-world exploration — image-blaster's splats hallucinate from extreme angles; we ship a guided walkable cone instead
- Editing the 3D scene after generation (moving objects, repainting walls) — Gaussian splats aren't normal meshes; out of scope for v1
- Outdoor wide-open scenes (beach, fields) — image-blaster underperforms there; we focus on interior scenes
- Voice cloning of public figures, celebrities, or people without consent — ethical line, not crossable
- Video generation of the scene as a Pixar-quality short (Storybook idea) — defer to future milestone

## Context

- **Hackathon project**: Stripe + ElevenLabs hackathon submission, May 2026. Tagged `#ElevenHacks`. Submission requires a viral-style video demo of the product.
- **Tech foundation**: Forks the open-source image-blaster repo (https://github.com/neilsonnn/image-blaster, MIT, 2.2K stars). The image-blaster pipeline orchestrates World Labs Marble 1.1 (Gaussian splat for environment) + FAL Hunyuan3D (per-object 3D meshes) + ElevenLabs SFX (ambient + per-object audio) + a React + Three.js viewer. Per-scene cost is ~$2.50–$3.50 of API spend.
- **Limitations of underlying tech**:
  - `.spz` Gaussian splats look great from the original camera angle, hallucinate from sideways angles
  - Indoor scenes work much better than outdoor
  - People in the source photo become uncanny if extruded to 3D — V3 plan is to inpaint them out and replace them with Hedra Character-3 talking avatars overlaid in 3D space
  - Generation takes 4–5 minutes (not instant — we frame this as "preserving forever")
  - 50K poly default per object — heavy on phones, may need LowPoly tier for mobile share links
- **Business model**: $19/scene one-time, $49/yr unlimited family plan, $299 lifetime archive. Healthy 5–7× markup over API cost.
- **Voice strategy**: ElevenLabs Instant Voice Cloning (IVC) for any voice — consent verification flow is mandatory for any voice not matched to the uploader's own voiceprint.
- **Demo strategy**: 60-second viral video. Founder uploads a photo of a late grandparent's living room → time-lapse of the splat building → walks into the 3D scene → grandparent's cloned voice plays softly → friend opens the share URL on their phone. Stripe success modal: "$19 — Memory saved forever."

## Constraints

- **Tech stack**: Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui on Vercel. Three.js / React-Three-Fiber for the viewer. ElevenLabs SDK for voice. Stripe Checkout (one-time) + Stripe Billing usage Meters (subscription overage). Forked image-blaster scripts (extracted as Node modules) called from API routes.
- **Default-everywhere policy**: Choose the most recommended/popular library version each time. No analysis paralysis. If two viable options exist with similar maturity, pick the one with more GitHub stars / better docs / official-team backing.
- **Mock-first for paid APIs**: World Labs Marble, FAL Hunyuan3D, ElevenLabs (voice clone + SFX), Stripe — all wrapped behind interface adapters with deterministic mock implementations. The app must run end-to-end with `MOCK_MODE=true` (no keys required). A clear "swap to real" doc + env-flag switch is part of the deliverable. This lets us demo and test without burning credits.
- **Testing-first policy**: Every phase ships with tests. Playwright e2e (full user flows), Vitest unit (pure logic, adapter contracts), API contract tests (mock vs real shape), accessibility tests. Aim for many tests, not perfect coverage. CI runs them on every commit.
- **Timeline**: Hackathon — target end-to-end shippable product in ~3 days of build time, demo-ready by submission deadline.
- **Budget**: $0 day-one (mock mode). $50–$100 in API credits when we swap to real (covers ~15-20 demo scenes + 50 voice clones).
- **Dependencies (real-mode)**: World Labs Marble API key, FAL Hunyuan3D, ElevenLabs Creator tier ($22/mo), Stripe (test mode for demo), Vercel. **None required for development/demo when MOCK_MODE=true.**
- **Compatibility**: Must work in Mobile Safari for share links (Three.js with WebGL fallback). Desktop Chrome/Safari/Firefox primary.
- **Performance**: Initial scene render: 4–5 min real / <5s mock. Viewer load: <3s on 4G mobile. Generation cost: <$3.50 in API spend per scene (preserves margin) — $0 in mock mode.
- **Security/ethics**: Voice consent gate is non-negotiable. No voice clone proceeds without an attestation step. Stripe payments handled via Checkout (no PCI scope).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork image-blaster, strip git history, make it ours | User wants ownership of the codebase; MIT license permits this; gives us freedom to evolve the pipeline | — Pending |
| Web-only, no native apps | Hackathon timeline + share-URL is the viral mechanic; phone Safari is enough | — Pending |
| Three.js viewer (not Unreal/Unity) | Image-blaster's existing viewer is React+Three.js; matches Next.js stack; phone-compatible | — Pending |
| Stripe Checkout + Meters (not custom billing) | Hackathon-appropriate; Stripe usage-based billing is purpose-built for this | — Pending |
| Defer multi-photo stitching to V2 | V1 needs to be a clean working demo first; multi-photo splat composition is non-trivial | — Pending |
| Defer Hedra talking-avatar overlay to V3 | Solves the "people look creepy" problem but adds significant complexity; ship voice-only narration in V1 | — Pending |
| Use ElevenLabs IVC (not PVC) for voice clones | Instant cloning works in seconds from a 30s sample; PVC takes hours of training | — Pending |
| Indoor scenes only as the marketing target | Image-blaster's sweet spot; "step into the room" framing avoids outdoor edge cases | — Pending |
| Mock-mode for all paid APIs from day one | User has no API keys yet; mocks let us build + test e2e immediately and swap to real later via env flag | — Pending |
| Tests required for every phase (Playwright + Vitest) | User explicitly asked for "many many tests"; non-negotiable | — Pending |
| Pick most-recommended/popular library at each fork | User said "just choose the most recommended" — avoid analysis paralysis | — Pending |

---
*Last updated: 2026-05-15 after initialization*
