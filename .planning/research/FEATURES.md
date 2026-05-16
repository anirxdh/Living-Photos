# Feature Research

**Domain:** Consumer AI image-to-3D / memorial / nostalgia / family preservation
**Researched:** 2026-05-15
**Confidence:** HIGH (cross-verified across MyHeritage, HereAfter AI, Luma AI, Polycam, Hedra, ElevenLabs, World Labs)

## Domain Context

Living Photos sits at the intersection of three distinct product categories:

1. **AI 3D scene generation** (Luma AI, Polycam, World Labs Marble, Splatica, Scaniverse) — consumers expect: shareable URL, web-embeddable viewer, mobile rendering, gallery/community
2. **Memorial / nostalgia AI** (MyHeritage Deep Nostalgia, HereAfter AI, FlexClip, Vidnoz) — consumers expect: emotional onboarding, voice cloning with consent, social-shareable output, "preserved forever" framing
3. **Single-shot consumer AI generators** (Higgsfield, Pika, Runway) — consumers expect: < 5 minute results, virality score / share kit, freemium with credit packs

Living Photos must hit table-stakes from all three categories on day one. Differentiation comes from being the *only* product that fuses walkable 3D + voice clone + memorial framing in one URL.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these = product feels broken or "not real."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Photo upload (drag-drop + file picker)** | Every consumer AI tool starts here | LOW (1) | shadcn `Input type="file"` + Vercel Blob or Cloudinary; accept JPEG/PNG/HEIC; client-side preview; <10MB limit |
| **Email-only signup + magic link auth** | Modern AI consumer apps skip password (Magic, Clerk, Supabase) | LOW (2) | Clerk or Supabase Auth; Stripe customer record created on first auth; Day-1 critical |
| **Generation progress UI (4-5 min wait)** | AI gen apps now standardize wait UX (research shows determinate progress + accelerating bar feels best) | MEDIUM (2) | Phase markers ("Building environment...", "Adding objects...", "Generating ambient sound...", "Cloning voice..."); accept email when done; never spin without context |
| **Walkable 3D viewer in browser (mobile + desktop)** | Polycam, Luma, Scene AI all offer this; web-embed is table stakes for splat products | HIGH (4) | Three.js + R3F; touch joystick on mobile, WASD + mouse on desktop; respect 44pt tap targets; WebGL 2.0 fallback |
| **Shareable URL (no login required to view)** | MyHeritage, Luma gallery, Polycam all do this; viral mechanic depends on this | LOW (2) | Public scenes at `/s/[slug]`; OG image card with thumbnail; copy-link button with toast |
| **Stripe Checkout (one-time + subscription)** | Standard pattern; users expect Apple Pay / Google Pay through Stripe | LOW (2) | Stripe Checkout hosted page; webhook → unlock generation; success page → "Memory saved forever" modal |
| **User dashboard ("My Memories")** | Bento-style consumer AI dashboards are standard 2026 UX | MEDIUM (2) | Grid of generated scenes, thumbnail + title + date; click to view; delete control |
| **Voice consent gate** | ElevenLabs requires this for IVC; legal & ethical floor | MEDIUM (3) | Live attestation recording ("I confirm I have permission to clone [name]'s voice"); voice-captcha-style verification; signed timestamp stored |
| **Mobile Safari rendering** | Share URLs land on phones; broken mobile = broken viral loop | MEDIUM (3) | WebGL 2.0 (avoid WebGPU — Safari incompatible); LowPoly tier <50K total polys; lazy-load splat in chunks |
| **Photo guidelines / "what works best"** | Consumers upload bad inputs (low-res, outdoor, group shots) without guidance | LOW (1) | Inline tooltip + example photos before upload; reject extreme cases pre-generation to save API spend |
| **Loading states with personality** | Cold spinners feel broken in 5-min waits | LOW (1) | Witty rotating copy ("Hand-painting the wallpaper...", "Teaching the lamp to glow...") |
| **Email notification on completion** | Users close tab during 5-min wait | LOW (2) | Resend or Postmark; "Your memory is ready" link → scene viewer |

### Differentiators (Competitive Advantage)

These are where Living Photos competes — none of MyHeritage, Luma, or HereAfter offers the full stack.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Voice clone as ambient narration in 3D space** | NO competitor combines walkable 3D + cloned voice ambient. MyHeritage has voice-on-face (D-ID partnership) but flat. HereAfter has voice-only chatbot. This is the *core* differentiator. | HIGH (4) | ElevenLabs IVC; play audio looped or position-triggered when user walks into specific zones; spatial audio via Three.js PositionalAudio |
| **15-second cinematic MP4 demo reel auto-generated** | Critical for viral loop; every TikTok/IG share needs vertical MP4. Higgsfield, Pika, Runway all generate share-ready MP4 by default in 2026. | MEDIUM (3) | Server-side: scripted Three.js camera path + recorded canvas → ffmpeg → 9:16 + 1:1 versions; subtle "Living Photos" watermark |
| **Memorial framing throughout UX** | MyHeritage Deep Nostalgia went viral (112M animations) precisely because it tapped this emotion. Most 3D scanning apps are sterile/technical. | LOW (1) | Copy: "Step inside the memory" / "Memory saved forever" / "Hear them again"; soft warm color palette; not "scan/render/export" language |
| **One-tap social share with pre-built captions** | Reduces friction to viral spread; Buffer/quso.ai data shows captions multiply share rate | LOW (2) | Share modal: "Post to Instagram" / "Send to family" with pre-filled caption + MP4 attached; copy-link as fallback |
| **Multi-photo stitching (V2)** | Splatica + Marble both support multi-image now; differentiator over single-photo competitors | HIGH (5) | Defer to milestone 2; combine 2-5 angles of same room into fuller scene |
| **Hedra Character-3 talking-avatar overlay (V3)** | Solves "people look uncanny in splats" — uniquely combines spatial 3D + omnimodal avatar. NO competitor does this. | HIGH (5) | Defer to milestone 3; inpaint people out of source, generate Hedra avatar, overlay in 3D space at original position |
| **"Family Plan" — multi-generation accounts** | Memorial products are inherently family-shared; supports preservation framing better than single-user | MEDIUM (3) | One subscription → multiple linked accounts; shared "family vault" of memories; defer to V2 |
| **Public memorial gallery (opt-in)** | Luma gallery + Polycam community show this works; MyHeritage doesn't have it. Could become an SEO + virality engine. | MEDIUM (3) | Default private; opt-in toggle to publish; curated homepage of "memories of the week"; defer past V1 hackathon |
| **AR mode (view scene in real space via phone)** | Polycam offers; emerging differentiator for spatial products. Niche but high-value. | HIGH (4) | WebXR fallback for iOS via Quick Look; defer past V1 |
| **Voice library — multiple voice profiles per scene** | Family members each get cloned voice; user toggles "Hear from Grandma" / "Hear from Grandpa" | MEDIUM (3) | Defer to V2; UX: voice selector chip in viewer corner |
| **"Memory letter" — text-to-voice with cloned voice** | Type a message, hear it in their voice; deep emotional value, simple to build | LOW (2) | Text input → ElevenLabs TTS with cloned voice ID → audio plays in scene; very high emotional payoff for low effort |
| **QR code on physical print → opens scene** | Boomers print photos; QR card mailer is high-value gift product | LOW (2) | Generate QR with scene URL + downloadable print template; could become a $79 "framed memory" SKU |

### Anti-Features (Commonly Requested, Often Problematic)

Listed competitors offer some of these. We deliberately don't.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Native iOS/Android apps** | "Real" products have apps; reviewer credibility | App Store review delay (7+ days) blocks hackathon timeline; voice cloning will trip Apple's AI-generated content review; web-only is the viral mechanic | Web-only + URL share; PWA install prompt for power users |
| **Free roam / open-world exploration** | "Walk anywhere" feels more powerful | Splats hallucinate badly from sideways/back angles — would shatter the magic; first impression wreckage | Constrained "walkable cone" with soft barriers; framing as "the view they had" |
| **In-scene editing (move objects, recolor walls)** | Users always ask "can I change…?" | Gaussian splats aren't meshes; editing is a research problem (World Labs ships hybrid editor but it's still rough); enormous scope creep | Frame as "preserved exactly as it was" — that's the value prop |
| **Outdoor scenes (beaches, fields, parks)** | Family memories happen outside too | Image-blaster / Marble underperform in wide-open scenes; demos would fail unpredictably | Marketing copy says "indoor scenes that mattered"; explicit reject in upload guidance |
| **Voice cloning of public figures, celebrities, deceased without family permission** | "Make Steve Jobs read me a story" type requests | Legal liability (right of publicity, likeness); reputational nuke; ElevenLabs ToS violation | Hard block via consent gate; if no live attestation → no clone |
| **Real-time multiplayer "walk together" in scene** | Cool factor; family video-chat-in-scene | WebRTC + Three.js sync is multi-week build; deferred for hackathon scope | Async share — everyone visits same URL; comments/guestbook later |
| **Editing the cloned voice (pitch, pacing, emotion sliders)** | Power users want control | Adds complexity; emotional output is the magic — over-control sterilizes it | Trust ElevenLabs defaults; one "Settings" link buried for advanced |
| **Pixar-quality video render of the scene** | "Storybook" idea — make a movie from the photo | Different product; would need scripting, character animation, scene direction | Future milestone; out of scope for V1 |
| **Free tier with watermark** | Standard SaaS playbook | Watermark on a *memorial* feels gross; cheapens the emotional product; MyHeritage gets criticized for this | Free *first scene* (no watermark) instead; pay to unlock more — better trust signal |
| **Credit packs ("buy 10 generations")** | 2026 trend; gives user budget control | Fragments mental model ($19/scene is clearer than "12 credits"); credit systems work for high-frequency tools, not emotional one-shots | One-time $19 OR unlimited subscription — two clear options |
| **AI chat with the deceased ("talk to grandma")** | HereAfter AI does this; high engagement | Crosses into "deepfake of person" territory; raises ethical bar dramatically; out of our identity | Voice narration only — they speak *to you*, you don't talk back. This is a deliberate ethical line. |
| **Login required to view shared scenes** | Capture viewer emails for marketing | Kills viral coefficient instantly; WhatsApp / iMessage forwards die at login wall | Public viewer; subtle "Make your own memory" CTA in corner |
| **Generation in <30 seconds (faster pipeline)** | "Faster is better" assumption | Apple SHARP can do single-image splats in 1s but quality is meaningfully worse; 5 min is a *feature* (frame as "carefully preserving") | Embrace the wait — it's the time required to do it well; emotional weight justifies it |
| **NFT / blockchain "ownership" of memories** | Web3 holdovers might ask | Toxic association with memorial products; Adds nothing to user value | Regular URL + downloadable file backups; "you own it" without ledger theater |

---

## Feature Dependencies

```
[Photo Upload]
    ├──requires──> [Auth (Clerk/Supabase)]
    │                  └──requires──> [Stripe Customer record creation]
    │
    └──feeds──> [Generation Pipeline (image-blaster fork)]
                    ├──requires──> [World Labs Marble API access]
                    ├──requires──> [FAL Hunyuan3D credits]
                    ├──requires──> [ElevenLabs SFX]
                    │
                    └──produces──> [Scene Assets (.spz + .glb + .mp3)]
                                       │
                                       ├──feeds──> [Three.js Viewer]
                                       │              ├──requires──> [Mobile WebGL fallback]
                                       │              └──enables──> [Shareable URL]
                                       │                                ├──enables──> [Social share modal]
                                       │                                └──requires──> [OG image generation]
                                       │
                                       └──feeds──> [MP4 Demo Reel Generator (V1.5)]
                                                       └──enables──> [Viral video share kit]

[Voice Clone (optional path)]
    ├──requires──> [Voice Consent Gate (live attestation)]
    │                  └──requires──> [Voice-captcha verification]
    │
    └──requires──> [ElevenLabs IVC API]
                      └──feeds──> [Ambient narration in viewer]
                                      └──enables──> [Memory Letter (text-to-cloned-voice)]

[Stripe Checkout]
    ├──requires──> [Auth]
    ├──unlocks──> [Generation Pipeline access]
    └──supports──> [One-time $19] OR [Subscription $49/yr] OR [Lifetime $299]

[Hedra Avatar Overlay (V3)]
    ├──requires──> [Person inpainting (remove from source photo first)]
    ├──requires──> [Hedra Character-3 API]
    ├──requires──> [Voice clone audio (existing dependency)]
    └──requires──> [3D positioning system in viewer (anchor avatar to splat)]

[Multi-photo Stitching (V2)]
    ├──requires──> [Multiple uploads UI]
    ├──requires──> [Marble multi-image input]
    └──conflicts──> [Single-shot generation expectations] (need separate flow)
```

### Dependency Notes

- **Photo Upload requires Auth, but Auth shouldn't gate the *try-it* experience.** Pattern: let user upload → preview their photo → at "Generate" CTA, prompt auth + payment in same modal. Reduces drop-off vs forced signup.
- **Stripe Customer record on first auth:** Use Clerk webhooks → create Stripe customer with email; means Checkout works seamlessly later.
- **Voice Consent Gate must run *before* IVC API call** — not after. Failed attestation = zero API spend.
- **MP4 Demo Reel depends on completed scene** — generate async after scene render so user gets viewer immediately, MP4 appears in dashboard 30-60s later.
- **Hedra Avatar Overlay (V3) requires person inpainting** — non-trivial preprocessing step; needs SAM2 or similar to mask person, inpainter to fill background, then Hedra to generate replacement avatar.
- **Multi-photo conflicts with single-shot UX** — different mental model; needs separate "Build a fuller scene from 2-5 photos" flow, not bolted onto V1 path.

---

## MVP Definition

### Launch With (V1 — 3-Day Hackathon Build)

The minimum that makes the demo video work and the product feel real.

- [ ] **Single photo upload** (drag-drop + picker) — Day 1, 2 hours
- [ ] **Auth (Clerk/Supabase magic link)** — Day 1, 2 hours
- [ ] **Stripe Checkout — $19 one-time** — Day 1, 3 hours (stub plan tier UIs, real Checkout)
- [ ] **Generation pipeline (image-blaster fork)** running server-side via Next.js API route — Day 1-2, 6 hours
- [ ] **Progress UI with phase markers** during 4-5 min wait — Day 2, 2 hours
- [ ] **Three.js viewer with walkable controls** (desktop mouse + mobile touch) — Day 2, 4 hours (most reuse from image-blaster)
- [ ] **Voice upload + consent gate + IVC clone** — Day 2, 3 hours
- [ ] **Ambient voice narration playing in scene** — Day 2, 1 hour
- [ ] **Shareable URL `/s/[slug]` (public, no auth)** — Day 2, 2 hours
- [ ] **OG image generation for share preview** — Day 3, 2 hours
- [ ] **Mobile Safari render verified** — Day 3, ongoing testing
- [ ] **"My Memories" dashboard** (grid of generated scenes) — Day 3, 2 hours
- [ ] **Email notification on completion** (Resend) — Day 3, 1 hour
- [ ] **Memorial-framed copy throughout UX** — Day 3, 2 hours polish
- [ ] **Demo video script + recording for submission** — Day 3, 4 hours

**Total estimated build: ~36 hours of focused work over 3 days.** Aggressive but achievable given image-blaster handles the hardest parts.

### Add After Validation (V1.5 — Week 1-2 Post-Hackathon)

Features to add once core works and we have some user feedback.

- [ ] **MP4 demo reel auto-generation** — Trigger: hackathon win or external interest. Critical for sustained virality.
- [ ] **Stripe subscription tier ($49/yr unlimited)** — Trigger: requests for "more than one"
- [ ] **Memory Letter (text-to-cloned-voice)** — Trigger: high engagement with voice feature
- [ ] **Public gallery (opt-in)** — Trigger: organic shares hitting traffic
- [ ] **Lifetime $299 plan** — Trigger: subscription churn data shows commitment-averse users

### Future Consideration (V2+)

Defer until we know V1 lands.

- [ ] **Multi-photo stitching (V2 milestone)** — Defer: significant pipeline work; needs validated demand for "fuller" scenes
- [ ] **Hedra Character-3 talking-avatar overlay (V3 milestone)** — Defer: most complex feature; requires inpainting preprocessor + 3D anchoring; the "creepy people" problem is real but V1 ships voice-only
- [ ] **Family Plan (multi-account)** — Defer: needs auth refactor; only worth it after subscriber data shows demand
- [ ] **AR mode (WebXR)** — Defer: niche; iOS Quick Look workflow is non-trivial
- [ ] **Voice library (multiple voices per scene)** — Defer: V2 once multi-photo lands
- [ ] **QR-coded physical print SKU ($79 framed memory)** — Defer: physical fulfillment is its own product; validate digital first

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Photo upload | HIGH | LOW | P1 |
| Auth (magic link) | HIGH | LOW | P1 |
| Stripe Checkout (one-time $19) | HIGH | LOW | P1 |
| Generation pipeline (forked) | HIGH | MEDIUM (mostly reuse) | P1 |
| Progress UI with phase markers | HIGH | LOW | P1 |
| Three.js walkable viewer | HIGH | MEDIUM (reuse) | P1 |
| Voice upload + consent + IVC | HIGH | MEDIUM | P1 |
| Ambient voice narration in scene | HIGH | LOW | P1 |
| Shareable URL (public) | HIGH | LOW | P1 |
| OG image for share preview | HIGH | LOW | P1 |
| Mobile Safari rendering | HIGH | MEDIUM | P1 |
| "My Memories" dashboard | MEDIUM | LOW | P1 |
| Email completion notification | MEDIUM | LOW | P1 |
| Memorial-framed copy | HIGH | LOW | P1 |
| MP4 demo reel auto-generation | HIGH | MEDIUM | P2 |
| Stripe subscription tier | MEDIUM | LOW | P2 |
| Memory Letter (text-to-voice) | HIGH | LOW | P2 |
| One-tap social share with captions | HIGH | LOW | P2 |
| Public opt-in gallery | MEDIUM | MEDIUM | P2 |
| Lifetime plan | LOW | LOW | P2 |
| Multi-photo stitching | HIGH | HIGH | P3 (V2) |
| Hedra Character-3 avatar overlay | HIGH | HIGH | P3 (V3) |
| Family Plan (multi-account) | MEDIUM | HIGH | P3 |
| AR mode | LOW | HIGH | P3 |
| Voice library | MEDIUM | MEDIUM | P3 |
| QR + physical print SKU | MEDIUM | HIGH | P3 |

**Priority key:**
- **P1** — Must ship in V1 (3-day hackathon MVP). Removing any of these breaks the demo or the trust.
- **P2** — Should add in V1.5 (week 1-2 post-hackathon) to compound virality and unlock revenue.
- **P3** — Future milestones (V2/V3); defer until V1 validates.

---

## Competitor Feature Analysis

| Feature | MyHeritage Deep Nostalgia | HereAfter AI | Luma AI / Polycam | Living Photos |
|---------|--------------------------|--------------|-------------------|---------------|
| **Source input** | Single photo (face) | Spoken interview audio | Multi-image / video capture | Single photo (full scene) |
| **Output type** | 10-15s animated face video | Audio chatbot | 3D Gaussian splat | Walkable 3D scene + voice narration |
| **3D / spatial** | None (2D animation) | None | 3D scan, no narrative | **Yes — full 3D walkthrough** |
| **Voice cloning** | Recently added (D-ID) | Recorded interview voice (no clone) | None | **ElevenLabs IVC, ambient in scene** |
| **Memorial framing** | Strong (signature use case) | Strong (legacy interviews) | Weak (technical/scanning tone) | **Strong (intentional positioning)** |
| **Share mechanism** | Social media share + watermark | App-only chat | Public link to gallery | **Public URL + MP4 reel** |
| **Mobile viewer** | Native app + web video | Native app | Web (Luma) + native | **Web (mobile Safari first-class)** |
| **Pricing** | $49.90/yr Photo plan | $9-25/mo subscriptions | Free → paid (Polycam $20/mo) | **$19 one-time / $49/yr / $299 lifetime** |
| **Ethical consent** | Implicit (own photo upload) | Strong (the person records themself) | N/A | **Explicit live attestation gate** |
| **Generation time** | 10-20 seconds | Async interview sessions | 5-30 min depending on scan | **4-5 min (framed as "carefully preserving")** |
| **Differentiator** | Famous deceased relatives demo | Conversational chatbot of dead | High visual fidelity | **Only product fusing all three: 3D + voice + memorial** |

**Strategic positioning:** Living Photos is *not* competing on visual fidelity (Luma wins) or on conversational depth (HereAfter wins) or on virality of single photo trick (MyHeritage wins). It wins by being the only product where you can *step into the room* and *hear the person* together. The unification of physical space + emotional presence is the moat.

---

## Special Attention Areas (per quality gate)

### Viral Share Mechanics

- **Public URL is non-negotiable.** Every barrier (login, captcha, paywall to view) reduces share rate exponentially. Viewer = public, generator = paid.
- **OG image preview must look stunning.** Auto-generate hero shot of scene from best camera angle; show on iMessage/WhatsApp/Twitter cards. This is the first impression — invest design time here.
- **MP4 reel is the V1.5 priority.** TikTok/Instagram/Reels are video-first; static URLs underperform. 9:16 vertical (TikTok/Reels) + 1:1 square (IG feed) versions auto-generated post-render.
- **Pre-built share captions** ("I just stepped back into my grandparents' living room. You can visit too: [link]") — reduce friction to copy-paste, multiply organic spread.
- **Subtle "Made with Living Photos" watermark on MP4 only** (not on the scene URL itself — that would feel cheap on a memorial product). Watermark on social-share artifact converts; watermark on the emotional product itself dilutes.
- **Email-a-friend native button** in viewer — for older demographic who shares via email, not social.

### Payment Flow Simplicity

- **Two paths only at MVP:** $19 one-time (clear, low commitment) or skip. Subscription added V1.5.
- **Show price *before* upload, not after.** Hide-the-price patterns destroy trust on emotional purchases.
- **Stripe Checkout hosted page** (not embedded Elements) for V1 — fastest to ship, Apple Pay / Google Pay built-in, PCI scope eliminated.
- **Success modal with emotional payoff:** "Memory saved forever. We'll email you when your scene is ready (~5 minutes)." Not a generic "Payment received."
- **Money-back guarantee mentioned explicitly** — emotional purchases need this safety net; Stripe refunds in 1 click.

### Consent Flow for Voice Cloning

- **Live attestation recording is mandatory** — text checkbox is insufficient (legal + ethical). User records short verbal statement: "I confirm I have the right to clone the voice of [Name] for this memorial scene."
- **Voice-captcha cross-check** — match attestation voice against the *uploader*'s voice (if known) or detect they're a real human (anti-bot). ElevenLabs's voice-captcha pattern is the reference implementation.
- **Stored attestation with timestamp + IP** — legal record per ElevenLabs ToS requirements.
- **Anti-feature: "Skip consent for testing"** — must not exist even in development environments. Slippery slope.
- **Different gate for "your own voice" vs "someone else's voice"** — uploader cloning self is lower bar (still needs consent click); cloning a third party is full attestation flow.
- **Clear copy on what's stored:** "Your attestation is saved as legal record. The cloned voice is private to your account. We never share or train on your voice data."

---

## Sources

### Direct competitor research
- [MyHeritage Deep Nostalgia (LiveMemory + voice via D-ID partnership)](https://www.myheritage.com/deep-nostalgia)
- [MyHeritage Deep Nostalgia 2026 Review](https://filmora.wondershare.com/ai-generation/deep-nostalgia-ai.html)
- [HereAfter AI (interview-based legacy chatbot)](https://www.hereafter.ai/)
- [Luma AI 2026 Review (Gaussian splat sharing)](https://www.thefuture3d.com/software/luma-ai/)
- [Polycam 2026 Review (3D scanning + share URL)](https://www.thefuture3d.com/software/polycam/)
- [VIVERSE Scene AI (3D Gaussian Splatting Generator)](https://www.viverse.com/ai/scene)
- [World Labs Marble docs](https://docs.worldlabs.ai/)
- [World Labs Marble — Multimodal World Model](https://www.worldlabs.ai/blog/marble-world-model)
- [Apple SHARP single-image splats](https://www.creativebloq.com/3d/apples-sharp-can-turn-a-photo-into-a-3d-scene-in-under-a-second)

### Voice cloning & consent
- [ElevenLabs Instant Voice Cloning docs](https://elevenlabs.io/docs/creative-platform/voices/voice-cloning/instant-voice-cloning)
- [ElevenLabs Voice Cloning Consent Rules 2026](https://margabagus.com/elevenlabs-voice-cloning-consent/)
- [Ethical Voice Cloning with ElevenLabs (Sacesta)](https://www.sacesta.com/our-work/blog/ethical-voice-cloning-elevenlabs-best-practices)
- [Vidnoz Dead Person AI Video Maker (consent considerations)](https://www.vidnoz.com/ai-solutions/make-the-dead-speak.html)

### Avatar / Hedra (V3)
- [Hedra Character-3 2026 Guide](https://magichour.ai/blog/guide-to-hedra-ai)
- [Hedra AI Talking Avatar product page](https://www.hedra.com/uses/ai-talking-avatar)
- [Hedra Character-3 omnimodal review](https://www.weshop.ai/blog/hedra-ai-review-2026-the-new-king-of-talking-heads-and-ai-avatars/)

### 3D viewer & mobile UX
- [Spark — advanced Three.js Gaussian Splatting renderer](https://github.com/sparkjsdev/spark)
- [GaussianSplats3D — open-source Three.js 3DGS](https://github.com/mkkellogg/GaussianSplats3D)
- [3D Gaussian Splatting web viewers guide 2026](https://www.utsubo.com/blog/gaussian-splatting-guide)
- [Three.js implementation guide for browser 3D viewers](https://altersquare.medium.com/building-3d-viewers-in-the-browser-three-js-implementation-guide-e3e87cbad1a7)
- [Mobile UX/UI Design Patterns 2026 — touch targets, walkable scenes](https://www.sanjaydey.com/mobile-ux-ui-design-patterns-2026-data-backed/)

### Pricing & business model
- [2026 AI Pricing Trends (Metronome — 50+ models analyzed)](https://metronome.com/blog/2026-trends-from-cataloging-50-ai-pricing-models)
- [How to Price AI Products (Aakash Gupta)](https://www.news.aakashg.com/p/how-to-price-ai-products)
- [Stripe Checkout for SaaS](https://stripe.com/payments/checkout)

### Generation queue UX
- [While We Wait — How users perceive AI generation waits (CHI 2025)](https://dl.acm.org/doi/10.1145/3706599.3719725)
- [Psychology of Waiting — UX progress patterns](https://medium.com/design-bootcamp/the-psychology-of-waiting-in-ux-0f0b24cdeb8f)

### Image-blaster (foundation)
- [image-blaster GitHub repo](https://github.com/neilsonnn/image-blaster)

### Digital legacy ecosystem
- [Best Family Storytelling & Legacy Apps 2026](https://evaheld.com/blog/the-best-family-storytelling-apps-of-2026-that-truly-last)
- [Digital Afterlife & AI Memorials 2026](https://newdeaths.com/2026/03/30/how-ai-memorials-are-redefining-mourning-in-2026/)

---
*Feature research for: Living Photos — consumer AI image-to-3D + voice clone memorial product*
*Researched: 2026-05-15*
