# Pitfalls Research

**Domain:** Consumer AI — Image-to-3D scene generation + voice cloning + Stripe payments (hackathon scope)
**Researched:** 2026-05-15
**Confidence:** HIGH (voice ethics, Stripe, Vercel, R3F) / MEDIUM (Hunyuan content policy, .spz mobile edge cases)

> This file is a survival guide for a 3-day hackathon build of Living Photos. The demo IS the product for judging — every pitfall below is filtered through "will this kill the demo or get us sued?"

---

## Critical Pitfalls

### Pitfall 1: Cloning a voice without ironclad consent — particularly of a deceased person

**What goes wrong:**
The product's emotional core is "hear grandma's voice from inside her living room." But uploading "grandma's voice" without explicit, documented consent from grandma (or her legal estate, if deceased) is a triple-threat: (1) civil right-of-publicity claim, (2) potential criminal fraud if the voice is used to impersonate her to others, (3) reputational firestorm of the "2wai" magnitude. The 2wai app went viral in November 2025 with a "talk to dead relatives" demo and got 40.9M views — then was dragged for weeks as "objectively one of the most evil ideas imaginable" with 210K likes on the takedown tweet. They had no consent flow. The hackathon judges will be voice-cloning experts (ElevenLabs is a sponsor). They will notice.

Concurrently, ElevenLabs is being sued (May 2026) by seven journalists/voice actors in Illinois federal court for cloning voices without consent. Senator Hassan opened a congressional inquiry in April 2026 after the FBI reported $893M in AI voice scam losses. California AB 1836 (deceased performer protection) takes effect in 2026 and explicitly requires estate consent.

**Why it happens:**
Founders see the emotional value, get the demo working with their own voice, and assume "users will figure consent out themselves." A "click here to confirm you have rights" checkbox is not consent. ElevenLabs' own IVC flow uses a voice-captcha — confirming the uploader's voice matches the cloned voice — precisely because attestation checkboxes are universally clicked without reading.

**How to avoid:**
1. **Live verification recording is non-negotiable** for any voice that isn't the uploader's own. Match the user's voiceprint against the voice they want to clone using ElevenLabs' Voice Verification. If they don't match → flow asks: "Do you have written consent from this person? Upload signed consent form or record this attestation: 'My name is X, the date is Y, and I authorize Living Photos to clone my voice.'"
2. **For deceased people: require explicit estate attestation.** Build a "this person has passed away" flow that requires uploader to attest under penalty of perjury they are the legal next-of-kin or estate executor, and require a second verification (email confirmation to a separate address, or upload of death certificate hash + identity match).
3. **Hard-block named public figures.** Maintain a denylist (start with the OFAC + Wikipedia top-10k public figures list) and screen voice sample transcripts for "I am [celebrity name]" patterns.
4. **Watermark every generation.** Use ElevenLabs' built-in watermarking; never strip it.
5. **Log everything.** Keep an immutable audit trail of: who uploaded what voice, what attestation was given, IP, timestamp. Required for any law enforcement response.
6. **Get a lawyer to review the consent flow before launch.** For hackathon, get a written acknowledgment of risk from a sponsor lawyer if available.

**Warning signs:**
- Demo script casually says "now let's clone Tom Hanks' voice"
- Anyone on the team says "we'll add consent later"
- The consent UI is a checkbox with tiny text
- Voice cloning works without uploader speaking on camera
- A user can paste a YouTube URL of a celebrity and get a voice clone

**Phase to address:**
**Phase 1 (foundation), gate before any voice cloning ships.** The consent gate must exist BEFORE the IVC API is callable from the frontend. If this is bolted on at the end, you'll ship without it.

---

### Pitfall 2: Live demo of a 5-minute scene generation = certain death

**What goes wrong:**
Judges have 60 seconds of attention. The image-blaster pipeline takes 4-5 minutes. If you demo this live, one of three things kills you: (1) the API stalls and you stand silent for 4 minutes, (2) the API returns garbage and you stand explaining for 4 minutes, (3) the wifi at the venue is bad and the upload alone takes 90 seconds. Every hackathon judge has war stories about live demos that died on stage. The Devpost guidance for 2026 is explicit: "judges will likely review multiple projects back to back" — they will not wait for your splat to render.

**Why it happens:**
Founders are proud of the magic and want to show it happening. They underestimate how rare it is for a multi-step async pipeline (Marble → Hunyuan3D → ElevenLabs SFX → splat compile) to fully succeed on the first try in a venue with shared wifi and judges watching.

**How to avoid:**
1. **Pre-render 3 demo scenes before the event.** Have them sitting at known share URLs. The demo flow opens them as "previously generated."
2. **Build a "fake generation" mode for live demos** that shows the time-lapse progress UI (the most visually impressive part) and then redirects to a pre-rendered scene. Brand this honestly in the README ("demo mode is pre-rendered; real generation takes 4-5 min") but use it on stage.
3. **Pre-record the canonical demo video.** The Stripe + ElevenLabs hackathon submission requires a video anyway. Make that video the source of truth and have the judges watch it; do NOT try to do the same flow live.
4. **If a live moment is needed, demo the voice clone live** (30 seconds, fast, works) and skip the splat generation. Show the splat as "here's the one I made earlier."
5. **Pre-fetch and warm-cache everything.** Have the scene .spz, audio MP3, and Three.js viewer pre-loaded in a service worker before stepping on stage.

**Warning signs:**
- Demo plan includes "and then we wait for it to render"
- No backup pre-rendered scene exists
- Demo has never been rehearsed end-to-end on the venue wifi (which is going to be terrible)
- The team is debating "should we generate live for authenticity?"

**Phase to address:**
**Final phase / demo prep.** Allocate at least 4 hours the day before submission for: recording demo video, pre-rendering 3 fallback scenes, rehearsing the 60-second live patter, and creating the "fake generation" mode.

---

### Pitfall 3: Vercel function timeout kills the generation midway

**What goes wrong:**
The image-blaster pipeline takes 4-5 minutes. Default Vercel serverless function timeout is 10 seconds on Hobby, configurable to 15 seconds default / 300 seconds max on Pro. The pipeline WILL exceed this. If you naively wrap it in a single API route, every generation request errors at exactly 300s with a 504, the user sees "something went wrong," and they assume your product is broken.

There's also a subtler trap: `Vercel Fluid Compute` with the `after()` API (Next.js 15.1+) extends to 14 minutes on paid plans / 800 seconds on Pro. But the request-response cycle is still bounded by what the client is willing to wait. A user staring at a spinner for 5 minutes is also a failure mode.

**Why it happens:**
Hackathon teams build "upload → call image-blaster CLI synchronously → return URL" in one API route. Works fine in dev with mocked APIs. Times out in production with real APIs. The team only discovers this 12 hours before the demo.

**How to avoid:**
1. **Decouple generation from request-response.** API route accepts upload → enqueues a job → returns `{ jobId, statusUrl }`. Client polls statusUrl (or uses Server-Sent Events / Pusher / Vercel KV pub-sub).
2. **Use Vercel Fluid Compute + `after()` to keep the generation worker alive.** The route returns the jobId immediately; the actual pipeline runs in the after() block. Set `maxDuration: 800` (Pro plan max). This avoids spinning up a separate queue infrastructure for hackathon scope.
3. **For zero-config queueing, use Inngest or Trigger.dev.** Both are designed for this exact pattern, both have generous free tiers. Inngest specifically calls out Vercel timeout solutions in their docs.
4. **Persist job state to Vercel KV or Postgres.** If the worker dies mid-generation (and it will, sometimes), the next poll can detect "job is dead" and either retry or surface the failure.
5. **Stream progress events.** The image-blaster pipeline has stages (Marble: 2min, Hunyuan3D objects: 1min, ElevenLabs SFX: 30s, splat compile: 30s). Surface those stages to the user; a stationary spinner for 5 minutes is the worst UX in the world.

**Warning signs:**
- API route handler does `await imageBlaster.generate(photo)`
- No `maxDuration` export in the route file
- Frontend has a loading spinner with no progress steps
- Generation works in dev but errors in production
- Logs show "FUNCTION_INVOCATION_TIMEOUT" or "504"

**Phase to address:**
**Phase 2 (generation pipeline).** Build the async job pattern BEFORE wiring up the real APIs. The architecture has to support 5+ minute jobs from day one or you're rewriting it on demo day.

---

### Pitfall 4: Stripe webhook double-charge or missed-fulfillment due to no idempotency

**What goes wrong:**
A user pays $19 via Stripe Checkout. Stripe sends `checkout.session.completed` webhook to your endpoint. Your endpoint creates a generation job. But Stripe retries on network blips, timeouts, or 5xx responses with exponential backoff for up to 3 days. Without idempotency, the same user gets 2-5 generations on their dime, or you double-charge, or worse — duplicate event triggers cause race conditions that leave the user with a "paid but no scene" black hole. This is THE most common Stripe production bug; Stripe's 2026 docs and every third-party guide lead with this warning.

**Why it happens:**
Hackathon code happy-paths the webhook: receive event → start job. The retries don't manifest in dev (because Stripe CLI replays cleanly). They manifest in production the first time a generation takes >10s to start and Stripe's retry fires before the first attempt persists.

**How to avoid:**
1. **Store `event.id` in a `processed_webhook_events` table with a unique constraint.** On webhook receipt: `INSERT ... ON CONFLICT DO NOTHING`. If conflict, return 200 immediately without processing. This is the canonical Stripe-recommended pattern.
2. **Verify the `stripe-signature` header** using the raw request body (not parsed JSON). Use Stripe's `constructEvent`. Wrong signing secret is the #2 most common failure.
3. **Persist payment intent → job mapping atomically.** When you create the generation job, write it with the `payment_intent_id` as a foreign key. On retry, if the job already exists for that PI, return success.
4. **Return 200 fast (<1s) and process async.** Webhook handler should: verify signature, persist event, enqueue downstream work, return 200. Do NOT call ElevenLabs / Marble / Hunyuan3D inside the webhook handler.
5. **Separate test mode and live mode signing secrets.** This is the #1 launch-day failure pattern — team configures test webhook in dev, switches to live mode for demo, forgets to update the signing secret, every webhook fails signature verification. Have two env vars (`STRIPE_WEBHOOK_SECRET_TEST`, `STRIPE_WEBHOOK_SECRET_LIVE`) and read based on `NODE_ENV` or a `STRIPE_MODE` flag.
6. **For the hackathon, stay in test mode for the demo.** Use Stripe test cards. Live mode adds risk with no benefit for judging.

**Warning signs:**
- No table or KV key tracking processed event IDs
- Webhook handler awaits long-running calls before returning 200
- One Stripe webhook secret in env (not separate for test/live)
- Logs show duplicate "generation started for session X" messages
- Two scenes appear under one payment in dev testing

**Phase to address:**
**Phase 4 (payments).** Build idempotency from the very first webhook handler — never as a v2 polish item.

---

### Pitfall 5: ElevenLabs credit pool burn — generation costs 2.8x what you budgeted

**What goes wrong:**
ElevenLabs bills per character. Failed generations still cost credits. Voice clones used for narration that gets regenerated (because the first take was robotic, or the user asked for a different line) bills again. Production users report actual cost 2.8x the per-character rate due to failed/regenerated calls. Credit pool burn is also concurrency-throttled at the Creator tier (you have $22/mo / ~100k characters but a low concurrency cap that throttles to 429s). Hackathon teams build "user types a line, hits regenerate 5 times" → blows through demo credits in one user session.

The product spec says "$50–$100 in API credits to demo (covers ~15-20 demo scenes + 50 voice clones)." That math is optimistic if regeneration is unbounded.

**Why it happens:**
Teams test on synthetic short text in dev, then real users paste 200-word narration scripts. Voice clones used as "ambient" play repeatedly per scene visit, but if architecture re-synthesizes on each play (instead of caching the MP3) credits burn every page load.

**How to avoid:**
1. **Cap regeneration to 3 attempts per scene.** After 3 takes, user must save one or contact support.
2. **Hard-cap input text length** to ~600 characters (10s of audio) for hackathon scope. Aligns with the "30-second voice sample" requirements anyway.
3. **Aggressively cache generated MP3s.** Voice + text combination should produce one MP3 stored in Vercel Blob or S3 with a content-hash filename. Every share-URL visit serves the cached file, never re-synthesizes.
4. **Use the Flash 2.5 model for narration** (0.5 credits/char) not the v2 model (1 credit/char). Quality difference negligible for ambient narration.
5. **Monitor credit burn in real time.** Set up a /metrics page showing current month spend; check it hourly during the demo phase.
6. **Pre-generate demo audio** for the rehearsal scenes. Don't burn live credits on every rehearsal.
7. **Have a credit emergency plan.** Know how to top up immediately if you run dry 1h before the demo.

**Warning signs:**
- No MP3 caching layer (audio regenerates per request)
- Demo includes "and now I'll regenerate this line a few times to show different voices"
- Credit burn rate >$5/day in development
- Frontend has unlimited regenerate button
- Voice synthesis happens on each scene page load

**Phase to address:**
**Phase 3 (voice generation).** Cache layer and regen caps must exist before the voice feature ships.

---

### Pitfall 6: Hunyuan3D extruding a face into a 3D mesh produces uncanny horror

**What goes wrong:**
Hunyuan3D-2 will happily take a photo of grandma's living room with grandma sitting on the couch and produce a 3D mesh of grandma — except the mesh is a flat-back, single-view extrusion with no eyes-in-the-skull, no real face geometry, only what the camera saw. The result looks like a mannequin with a printed face — deeply uncanny. The product is designed to celebrate the deceased; an uncanny grandma 3D mesh inside her own living room is the worst possible emotional payload.

The PROJECT.md acknowledges this ("People in the source photo become uncanny if extruded to 3D — V3 plan is to inpaint them out"). But "V3" is a deferred plan; the V1 demo will have whatever Hunyuan3D outputs, which means real users uploading photos with people in them get the uncanny output unless we explicitly handle it.

Hunyuan3D does not have an explicit "no people" content policy (unlike, say, OpenAI), and there's no NSFW filter that would catch this. FAL.ai has a general NSFW image filter but it's not wired into the Hunyuan3D pipeline by default. The model will just make the uncanny thing.

**Why it happens:**
Image-to-3D models are trained mostly on objects, not people. Face geometry is hard. Without explicit person-detection + inpainting, the pipeline blindly processes whatever object segmentation gives it.

**How to avoid:**
1. **Detect people in the source image at upload time.** Use a fast model (FAL ai/face-detection or yolov8) before sending to the pipeline. If people detected: present user choice — "(A) inpaint them out and use audio only, (B) keep them in (warning: may look unusual)."
2. **For V1, default to inpaint-and-warn.** Use a fast inpainting model (FAL ai/lama-cleaner or similar) to remove detected people from the source before sending to Hunyuan3D. The Marble splat will hallucinate plausible background where the people were.
3. **Hide the V3 Hedra avatar promise.** Don't say "people will be talking avatars" in the demo. Set expectations to "the room becomes the canvas; voices become the soul."
4. **Frame the limitation as a feature.** "Living Photos preserves the space, not the people — their voices live in the space."

**Warning signs:**
- Test photos include people; output meshes look like printed cardboard
- Demo photos chosen are all "empty rooms" — but real users won't have those
- No person-detection in the upload pipeline
- The team hasn't tested on a photo with 3+ people

**Phase to address:**
**Phase 2 (generation pipeline).** Person-detection-and-inpaint must be in the pipeline before V1 ships, or the demo can only use empty-room photos.

---

### Pitfall 7: Share URL serves a 50K-poly scene to an iPhone, which crashes Safari

**What goes wrong:**
Image-blaster default is 50K polys per object. A scene with 5 objects = 250K polys + the Gaussian splat (which can be 50-500MB of GPU memory for a 500K-gaussian scene). The Three.js + R3F viewer attempts to load all of this on a phone share URL. iPhone Safari has a documented WebGL memory crash pattern: tabs have limited memory, unified GPU/CPU memory, and exceeding the limit triggers tab reload or freeze. Worse, "applications crash after a certain time, so much so that Safari can no longer show WebGL until it is cleared or rebooted" — a documented three.js forum issue. Your viral share URL becomes a brand-damaging "this site broke my phone" experience.

The share URL is the viral mechanic. If 30% of opens crash on mobile, the loop is dead.

**Why it happens:**
The desktop dev experience works fine — 16GB of RAM, dedicated GPU. The team doesn't test on a 3-year-old iPhone with 3GB of RAM until demo day, when a judge opens the share URL on their iPhone 13 and it crashes.

**How to avoid:**
1. **Build a LowPoly tier for mobile share links.** Detect mobile UA at the share URL endpoint and serve a 10K-poly version of the scene + a downsampled .spz (50K gaussians instead of 500K). Use Niantic's SPZ format — explicitly designed to be ~10x smaller than PLY with no perceptible quality loss; loads in 1.5s on iPhone 15 Pro.
2. **Set Canvas perf params for mobile aggressively:**
   ```jsx
   <Canvas
     dpr={[1, 2]}  // cap pixel ratio
     gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false, depth: true }}
     frameloop="demand"  // render only on interaction
     performance={{ min: 0.5 }}
   >
   ```
3. **Use drei's PerformanceMonitor** to dynamically downgrade quality if FPS drops below 30.
4. **Test on a real iPhone before demo.** Not the simulator — iOS simulators have unreliable OpenGL ES support. A physical iPhone 12 or older is the worst-case real device.
5. **Provide a graceful fallback.** If WebGL2 unavailable or memory pressure detected, fall back to a static 360° image with audio. Still preserves the share moment without the crash.
6. **Run Lighthouse mobile audit.** Target LCP <3s on 4G as the spec requires.

**Warning signs:**
- No mobile testing has happened
- No `frameloop="demand"` on Canvas
- The scene loads >100MB of assets
- Devtools shows GPU memory >500MB
- Share URL has never been opened on a real phone

**Phase to address:**
**Phase 2 (viewer)** for the LowPoly tier + Canvas perf; **Phase 5 (share/distribute)** for real-phone testing.

---

### Pitfall 8: World Labs Marble API key waitlist breaks the whole timeline

**What goes wrong:**
PROJECT.md says: "World Labs Marble API key (~24h waitlist)." The whole product depends on this key. If the waitlist takes 48h, or if the key gets approved but rate-limited to 5/day, the build slips by a full day. The first 24h of the hackathon is supposed to be wiring up the pipeline; if you're sitting in waitlist purgatory, you're losing your most productive cycles.

**Why it happens:**
Founders sign up Day 1 of the hackathon assuming "24h waitlist" means "we'll be coding tomorrow." World Labs may prioritize commercial waitlists; 24h is the optimistic case.

**How to avoid:**
1. **Apply for the Marble API key NOW, before the hackathon starts.** Same for FAL and ElevenLabs Creator tier.
2. **Apply with two different emails** as backups if the primary takes longer.
3. **Use the Marble Plus tier ($5 min purchase, 1500 credits/world = $1.20/world).** Buy $20 of credits upfront — covers 16 worlds. Don't pay-per-call.
4. **Have a fallback architecture** that can demo on Hunyuan World 1.0 (also on FAL) if Marble is blocked. Hunyuan World is also a splat generator from a single image; less polished but unblocking.
5. **Pre-generate 5 scenes** the moment the key arrives. Bank them as demo material.

**Warning signs:**
- Day 1 of hackathon and you haven't applied yet
- Email confirmation says "we'll get back to you within 7 business days"
- Demo scenes haven't been generated 24h before submission deadline

**Phase to address:**
**Phase 0 (pre-build setup), TODAY.** Apply for keys before any code is written. This is the most time-sensitive prerequisite.

---

### Pitfall 9: World Labs Marble cost surprises — $1.20/world adds up faster than expected

**What goes wrong:**
Marble 1.1 is 1,500 credits/world at $1.00 per 1,250 credits = $1.20/world. Marble 1.1 Plus is 1,500 base + 300 per dynamic cube (up to 5) = up to $2.40/world. Combined with Hunyuan3D ($0.16-$0.375/object × ~5 objects = $0.80-$1.88) and ElevenLabs (~$0.10/scene narration), the per-scene cost is $2.10-$4.50. PROJECT.md budgets $2.50-$3.50 per scene with a $50-$100 demo budget = 14-40 scenes possible.

But: rehearsals burn scenes. Failed generations still cost credits (Marble bills on submission, not success — verify in docs but assume worst case). Three founders each "testing" a scene = $10. By demo day, the team has spent $80 of the $100 budget on iteration and has no headroom for a re-rehearsal.

**Why it happens:**
"$1.20 per scene" feels free at dev time. Teams iterate freely without cost awareness. The accountant moment comes after the bill arrives.

**How to avoid:**
1. **Track scene generation cost in real time.** Log every Marble + FAL + ElevenLabs call with cost; surface running total in dev UI.
2. **Set a hard cap of 5 generations per team-member per day.** Forces deliberate prompt engineering vs. spray-and-pray.
3. **Pre-generate the demo scenes early** (Day 2 evening) and lock them. Don't regenerate "just one more time" the morning of the demo.
4. **Use Marble 0.1-mini ($0.12/draft) for prompt testing.** Draft worlds to verify the camera framing, then upgrade to 1.1 only for final.
5. **Budget at $5/scene worst-case** for accounting. 20 scenes = $100, includes a 30% buffer for failures.

**Warning signs:**
- Team has generated 30+ scenes by Day 2
- No cost dashboard exists
- "We'll just buy more credits if we run out" — except the team's credit card is maxed
- Marble dashboard shows $40 spent on Day 1

**Phase to address:**
**Phase 2 (pipeline)** — wire cost telemetry into the generation flow from the start.

---

### Pitfall 10: Three.js + Next.js SSR hydration mismatch breaks the viewer on cold load

**What goes wrong:**
React-Three-Fiber's Canvas accesses `window` and `document` during render. Next.js App Router SSR pre-renders components — and crashes (or hydrates mismatched DOM) when Three.js code runs in Node. Symptoms: cold page load shows a broken viewer, hydration error in console, scene appears only after a hard refresh. For a share URL — which is opened cold by everyone — this is catastrophic.

**Why it happens:**
Developers `import { Canvas } from "@react-three/fiber"` at the top of a page component. Works in dev (Fast Refresh masks SSR issues). Breaks in production deployment.

**How to avoid:**
1. **Always dynamically import R3F components with `ssr: false`:**
   ```tsx
   const Scene = dynamic(() => import("@/components/Scene"), { ssr: false, loading: () => <SceneLoader /> });
   ```
2. **Add a meaningful loading component** — for a share URL, a static preview image of the scene + "Loading 3D world…" is far better than a blank canvas.
3. **Mark the viewer page as `"use client"`** at the top, but the dynamic import still helps because Next.js will skip prerender entirely for the Canvas portion.
4. **Test the production build locally** (`next build && next start`) — SSR issues only show in production builds, not in `next dev`.
5. **Set `dynamic = 'force-dynamic'`** on the scene route if all else fails — disables static optimization but guarantees no SSR weirdness.

**Warning signs:**
- Console hydration errors on the share URL page
- Scene only appears after refresh
- Build logs warn about `window is not defined`
- `next build` fails on the share route

**Phase to address:**
**Phase 2 (viewer) and Phase 5 (share URL).** SSR-safe pattern must be set up from the first time Canvas is added.

---

### Pitfall 11: Anyone can upload a photo of a celebrity, generate a scene, and share it — and you're on the hook

**What goes wrong:**
The share URL is public. The product is a viral toy. The first 4chan post will be a photo of [recently-deceased celebrity]'s living room with their cloned voice doing something offensive. The clip will be screenshotted, you'll get a New York Times call, and your hackathon project becomes "the AI grief-exploitation app." This is exactly the 2wai trajectory, and they had a soft launch — you're going viral via #ElevenHacks.

DMCA safe harbor protects platforms from infringement claims IF you have a registered DMCA agent + a takedown process + a repeat-infringer termination policy. None of those exist on Day 1 of a hackathon. And right-of-publicity claims (the more dangerous claim for voice clones) are NOT covered by DMCA safe harbor — those are common-law state claims, increasingly codified (California AB 2602, AB 1836). You can be sued for those even with a takedown process.

**Why it happens:**
Teams assume "users won't abuse it." Users always abuse it. The viral mechanic that drives demos is the same mechanic that drives abuse.

**How to avoid:**
1. **Voice consent gate handles 90% of this** — if you can't clone a celebrity's voice without their voiceprint matching, you can't make a celebrity scene. Pitfall 1 is your front-line defense.
2. **Image abuse: maintain a celebrity face denylist** (or use a face-recognition API like FAL's face detection + an embedding lookup against a small public-figure set). Reject uploads matching the denylist.
3. **All share URLs must have a "report this scene" button** with a 1-click takedown flow that nukes the scene from your storage within 1h. Auto-nuke on report (review later) is safer than human-review-first.
4. **Display the uploader's attestation prominently** on the share page: "This scene was created by [user] who attested they have rights to the photo and voice."
5. **Have a legal page** before launch with: ToS, AUP (no impersonation, no celebrities, no minors, no deceased without estate consent), DMCA agent contact, takedown form.
6. **Don't ship as a "public" hackathon launch.** For hackathon, demo with curated content only. Don't open the upload form to the world during the judging period.

**Warning signs:**
- Share URLs are world-readable with no abuse-reporting mechanism
- Demo plan includes "and anyone can upload any photo"
- No ToS / AUP page
- No celebrity denylist
- No log of who uploaded what

**Phase to address:**
**Phase 5 (share/distribution).** Before any share URL is publicly shareable, abuse mechanisms must exist.

---

### Pitfall 12: API key juggling — keys committed, demo machine missing env, prod has dev keys

**What goes wrong:**
Hackathon teams use 5 different API services (Stripe, ElevenLabs, FAL, World Labs, Vercel), each with test + live keys, on 3 different machines (two laptops + Vercel deployment). Inevitably: someone commits a key to git, someone's local .env diverges from Vercel's prod env, demo machine has the wrong Stripe webhook secret, ElevenLabs key gets rate-limited because both founders used the same one. One of these will block the demo.

**Why it happens:**
.env files diverge. No source of truth for which key is in which environment. "I'll send you the keys on Slack" → keys leak. No team-wide secret manager.

**How to avoid:**
1. **Use Vercel's env var dashboard as source of truth.** All keys live there per environment (preview, production, development). Pull locally with `vercel env pull .env.local`.
2. **Never commit `.env*` files.** Add to `.gitignore` immediately. Check `git log -p` for accidental commits; if found, rotate the key.
3. **One ElevenLabs Creator account per team.** $22/mo. Share via 1Password / Bitwarden. Don't have each founder use a personal account.
4. **Document key sources in README**: which keys are needed, where to get them, who has access.
5. **Use Stripe restricted keys** for the demo if possible — generation key, not full API access.
6. **Test the production env on the actual demo machine** at least 24h before demo. Vercel preview deployments use preview env vars; production deployments use production env vars; they can diverge.
7. **Pre-stage the demo on the venue machine** (or use your own laptop, not a venue machine). Don't trust shared Wi-Fi DNS, don't trust display dongles, don't trust mystery machines.

**Warning signs:**
- A team member says "what's the Stripe webhook secret?"
- .env file shows up in `git status`
- Different env vars in different deployments
- ElevenLabs returns 429 in the middle of a test
- The demo plan involves logging into Vercel during the demo

**Phase to address:**
**Phase 0 (setup)** for env hygiene; **demo prep** for production deployment verification.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Synchronous API route for generation (no queue) | Ships in 1 hour vs. 4 | Will time out in production; demo dies | Never — must be async from day 1 |
| In-memory job state (no DB persistence) | No setup overhead | Worker dies → job lost; user paid but no scene | Acceptable for first 6 hours; replace with Vercel KV before payments wired up |
| Hardcoded ElevenLabs voice ID instead of per-user cloning | Skips IVC flow entirely | Demo is fake; judges notice immediately | Acceptable for landing-page mock only; NOT acceptable for the demo product |
| Single .spz tier (no LowPoly fallback) | Skips mobile optimization | 30% of share URL opens crash on phones | Acceptable for Day 1 desktop demo; must have LowPoly before share URLs go public |
| No voice consent flow (checkbox only) | Saves 4 hours | Legal exposure + reputational damage + likely judging disqualification | Never |
| Test mode Stripe only (no live mode wiring) | Avoids complexity | Can't accept real payments | Acceptable for hackathon judging — DON'T enable live mode for the demo |
| Stripe Checkout (not custom UI) | No PCI scope, 30 min setup | Less branded experience | Always acceptable; Stripe Checkout is the right call |
| No abuse reporting on share URLs | Saves 2 hours | First viral abuse case = takedown chaos | Acceptable IF share URLs are private/unlisted for the demo period |
| Demo using your own photos only | Always works | Doesn't prove the product handles arbitrary input | Acceptable for the polished demo video; not for live judge interaction |
| All API calls in client (exposing keys) | Faster local dev | Keys leak immediately | Never — always route through server |
| Skip person-detection inpainting | Saves 4 hours | Uncanny mesh in any photo with people | Acceptable IF demo photos are curated empty rooms; not acceptable for "upload any photo" UX |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe webhooks | Awaiting long jobs inside webhook handler | Verify signature, persist event ID, enqueue job, return 200 in <1s |
| Stripe webhooks | Same signing secret for test + live | Separate env vars; read based on mode |
| Stripe Checkout | Not using `payment_intent.metadata` for job linking | Include `userId` + `jobId` in metadata; reference on webhook |
| Stripe Billing meters | Using legacy `usage_type: 'metered'` without Meter object | API version 2025-03-31.basil requires Meter; legacy API is gone |
| ElevenLabs IVC | Skipping voice-captcha attestation for non-uploader voices | Always force live recording attestation if voiceprint doesn't match uploader |
| ElevenLabs API | Re-synthesizing on every page load | Cache MP3 by `hash(voiceId + text)` in Vercel Blob; serve cached |
| ElevenLabs API | Hitting 429 from concurrency cap | Queue at most 2-3 concurrent calls; exponential backoff on 429 |
| ElevenLabs API | Using v2 model for ambient narration | Use Flash 2.5 (0.5 credits/char, negligible quality diff) |
| World Labs Marble | Burning credits on draft prompts with Marble 1.1 | Use Marble 0.1-mini ($0.12) for drafts; 1.1 only for finals |
| World Labs Marble | Not bulk-purchasing credits | Buy $20 upfront (25,000 credits = 16 worlds), avoids minimum purchase friction |
| FAL Hunyuan3D | Default 500K face count on every object | Use 50K-100K for hackathon demo; 500K is overkill and slow |
| FAL Hunyuan3D | Sending photos with people without pre-filtering | Detect people, inpaint out, or warn user |
| Next.js App Router | Importing R3F at module top | Dynamic import with `ssr: false` |
| Next.js App Router | Long-running API route without Fluid Compute | Use `after()` from `next/server` (Next.js 15.1+) for background work |
| Vercel deployment | Hobby plan for production demo | Pro plan minimum ($20/mo) for 300s+ functions |
| Vercel deployment | No `maxDuration` export on long routes | Set explicitly: `export const maxDuration = 800;` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 50K-poly objects served to mobile | iPhone Safari freeze, "this site killed my phone" reports | LowPoly tier (10K) for mobile UA | First mobile share URL opens |
| .spz with 500K+ gaussians on mobile | 5s+ load time, GPU memory >500MB | Downsample for mobile; use Niantic SPZ format for compression | iPhone 12 or older immediately |
| No frame-loop demand on Canvas | Phone battery drain, scene rendering at 60fps when static | `frameloop="demand"` | Within 2 minutes of viewing |
| Splat CPU sort runs every frame | FPS drops to 15-20 on midrange hardware | Tune `splatSortDistanceMapPrecision`; consider GPU sort experimental flags | At 100K+ gaussians on mobile |
| Synchronous API route timeout | 504s on the generate endpoint | Async job pattern + Fluid Compute `after()` | First real generation attempt |
| Audio re-synthesis per page load | ElevenLabs credit burn, slow page load | MP3 cache by content hash | Day 2 of usage |
| No image-asset optimization in viewer | 200MB scene downloads, 30s mobile load | Pre-process splat with KSPLAT-style chunked streaming | First scene >100K gaussians |
| Eager generation pipeline (no progress streaming) | 5-minute spinner, user bounces | SSE stream from job worker with stage events | First user testing session |
| No connection pooling for DB writes | Webhook handlers timeout under burst | Use a connection pool; offload DB writes from webhook | At >10 webhooks/sec, irrelevant for hackathon |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Voice consent attestation is checkbox-only | Legal exposure (right of publicity, AB 1836, AB 2602); 2wai-magnitude PR firestorm | Live voiceprint match + recorded attestation for non-uploader voices |
| Public share URLs with no abuse reporting | Celebrity/minor exploitation; brand damage | Visible "Report this scene" button; auto-nuke on report |
| User-controlled photo uploads with no content filtering | CSAM, NSFW, celebrity content liability | Run all uploads through FAL NSFW filter + face-recognition against celebrity denylist |
| API keys in client-side bundle | Immediate quota theft, credit drain | Route ALL third-party API calls through server; verify in `next build` output |
| .env files committed to git | Key compromise, financial loss | Pre-commit hook (e.g., `gitleaks`); rotate any leaked key immediately |
| Stripe live mode keys in dev | Real charges from test cards; difficult refunds | Strict separation; test mode only for hackathon |
| Stripe webhook handler doesn't verify signature | Forged webhooks fulfill fake payments | Always `constructEvent` with raw body + signing secret |
| No rate limiting on upload endpoint | DOS via cost (someone spams photo uploads, drains your credit pool) | Rate limit per-IP and per-account (Vercel KV-based limiter); require auth |
| No audit log for who uploaded what | Can't respond to law enforcement / takedown request | Persist (upload ID, user, IP, timestamp, file hash, attestation) for every upload |
| Voice clones retained indefinitely | GDPR / CCPA exposure; legal subpoena scope creep | Set 90-day TTL on stored voice models; honor deletion requests within 30 days |
| Share URLs guessable (sequential IDs) | Bulk enumeration of private scenes | Use UUIDv4 or nanoid; never sequential IDs |
| No watermark on generated audio | Cloned voice used in deepfake; can't trace to your platform | Always use ElevenLabs' built-in inaudible watermarking; never disable |
| Demo mode bypass shipped to production | "test mode" backdoor exploitable | Gate demo mode by env var, not URL param; verify production env in CI |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Stationary spinner during 5-min generation | User bounces, assumes broken | Streaming progress UI: "Building world (45%) → Generating objects (10%) → Composing audio (0%)" |
| "Click here to confirm consent" only | Users click without reading; consent is invalid; legal exposure | Force a recorded attestation (15s of speech) before voice clone proceeds |
| No preview before payment | User pays $19 to find out the scene is bad | Show a low-resolution preview / scene draft (Marble 0.1-mini, $0.12) before payment gate |
| Generic "something went wrong" on failure | User can't tell if to retry, contact support, or wait | Distinct error states: "API quota hit (retry in 5m)", "Photo wasn't suitable (try indoor)", "Server error (we're investigating)" |
| Voice consent flow buried in flow | Users skip it accidentally | Make consent the FIRST step before any voice upload UI shows |
| Share URL has no preview metadata | Sharing on iMessage / Twitter shows ugly URL with no preview | Generate Open Graph tags + a static preview image per scene |
| Demo reel MP4 takes 30s to render after generation | User loses interest before share moment | Render MP4 in parallel with splat; offer share button as soon as scene is viewable |
| No "this took 5 min, save it" framing | Users expect instant, feel ripped off | Frame as ritual: "Worth waiting for. Preserved forever." Show a countdown of how much faster this would be without quality. |
| Forgetting the "this is a 3D scene, drag to look around" instruction | Users see static splat, think it's a photo, leave | First-time hint overlay with mouse-drag animation; persist until first drag |
| Mobile users can't interact with Canvas (no touch handlers) | Phone visitors see static scene only | Wire up touch gestures from drei or @use-gesture/react; test on iOS Safari |
| "Generation failed" with no refund mechanism | User paid but got nothing → chargeback | Auto-refund on confirmed generation failure (Stripe API supports this; build it Day 3 if no time, but build it) |
| Voice clone sample upload UI doesn't explain "30 seconds, quiet, only this person speaking" | Users upload muddy crowd noise; voice clone fails or is robotic | Inline guidance with example audio; reject uploads <20s or with detected multiple voices |

---

## "Looks Done But Isn't" Checklist

- [ ] **Generation flow:** Works in dev with mocked APIs — verify it works end-to-end with REAL API calls including the 4-5 min wait, on production Vercel deploy
- [ ] **Stripe webhook:** Returns 200 in test mode with CLI — verify idempotency by replaying the same event 3 times; only one job should be created
- [ ] **Voice consent gate:** Has a checkbox — verify there's a live voiceprint match OR recorded attestation; checkbox alone is not consent
- [ ] **Mobile share URL:** Loads on the dev's iPhone 15 — verify on an iPhone 12 (or simulator with throttled memory) without crashing
- [ ] **Stripe Checkout success:** Redirects to a thank-you page — verify the webhook actually fired and the job is enqueued (not just the redirect)
- [ ] **Demo video:** Records the magic moment — verify it shows REAL output, not a Figma mockup or pre-rendered fake
- [ ] **Person inpainting:** Empty-room test photos work — verify with a photo containing 2+ people; check the output isn't uncanny
- [ ] **ElevenLabs voice clone:** Cloning the founder's voice works — verify cloning a second voice (with consent flow) also works; verify denylist blocks "celebrity"
- [ ] **Three.js viewer:** Renders in dev — verify it renders in `next build && next start`; SSR errors only show in production builds
- [ ] **Share URL:** Opens for the logged-in user — verify it opens in a private browser window (no auth) to confirm public access works
- [ ] **Cost telemetry:** Logs cost per scene — verify monthly total is under demo budget after running 5 rehearsal generations
- [ ] **Error states:** Happy path works — verify what happens when Marble returns 429, Hunyuan3D fails on an object, ElevenLabs hits quota
- [ ] **Demo machine:** Has the deployment URL — verify the laptop you'll demo on has the env vars, network access, and a tested rehearsal
- [ ] **Abuse reporting:** Doesn't exist yet — at minimum, have a contact email + manual takedown procedure documented
- [ ] **API keys:** Set in Vercel — verify with `vercel env ls`; verify NONE are in git history
- [ ] **Demo backup:** Pre-rendered scenes exist — verify they load fast and look great; rehearse the "demo failed, switch to backup" patter

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Live demo generation stalls mid-flow | LOW | Switch to pre-rendered scene; "this one took 5 min so here's one I made earlier"; never apologize, narrate the value |
| Vercel function timeout in production | MEDIUM | Move to Fluid Compute `after()`; rewrite as async job; takes 2-4h |
| Stripe webhook firing twice creates duplicate scenes | MEDIUM | Add unique constraint on `processed_webhook_events.event_id`; backfill clean up duplicates; takes 1-2h |
| ElevenLabs credit pool drained | LOW (immediate) / HIGH (if no time) | Top up via dashboard (5 min); if no budget, use the v3 free trial on a backup account; pre-cache all needed audio |
| World Labs key not approved | HIGH | Switch to Hunyuan World 1.0 on FAL as splat backend; takes 4-6h of code changes |
| Photo with people produces uncanny mesh | MEDIUM | Add pre-pipeline person detection + inpaint; takes 2-3h; in emergency, swap test photos for empty rooms |
| iPhone share URL crashes | MEDIUM | Ship LowPoly tier with mobile UA detect; takes 3-4h; emergency hotfix is to serve static 360° image with audio |
| API key committed to git | LOW (rotate) / MEDIUM (with leaks) | Rotate immediately; force-push removal from history; check service for unauthorized usage |
| Voice consent missing → judge calls it out | HIGH | Cannot recover live; have the verification flow built BEFORE demo |
| Wrong Stripe signing secret in production | LOW | Read correct value from Stripe dashboard; update Vercel env; redeploy; takes 10 min |
| Demo video is too long / wrong | LOW | Re-record with phone screen recording + voiceover; 30 min effort |
| Three.js viewer SSR error on production deploy | LOW | Wrap in `dynamic(..., { ssr: false })`; takes 15 min |
| User uploads CSAM or other illegal content | CRITICAL | Have a takedown procedure documented BEFORE launch; report to NCMEC; preserve evidence; consult counsel |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| #1 Voice consent missing | Phase 0 (setup) + Phase 3 (voice) | Manual test: try to clone a voice that isn't uploader's; verify denied or forces attestation |
| #2 Live demo stalls | Final phase (demo prep) | Rehearse demo on actual venue setup; verify pre-rendered fallback works |
| #3 Vercel timeout | Phase 2 (generation pipeline) | Trigger a 5-min generation in production; verify it completes without 504 |
| #4 Stripe webhook idempotency | Phase 4 (payments) | Replay same webhook 3x via Stripe CLI; verify exactly one job created |
| #5 ElevenLabs credit burn | Phase 3 (voice) | Run 10 generations; verify monthly spend projection is under budget |
| #6 Uncanny face mesh | Phase 2 (pipeline) | Generate scene from photo with 3 people; verify output is clean |
| #7 Mobile crash | Phase 2 (viewer) + Phase 5 (share) | Open share URL on iPhone 12; verify <3s load, no crash, scene visible |
| #8 World Labs waitlist | Phase 0 (setup) — TODAY | Confirmation email received; API key works in test call |
| #9 Marble cost surprise | Phase 2 (pipeline) | Cost dashboard live; monthly projection <$100 |
| #10 SSR hydration | Phase 2 (viewer) | `next build && next start` succeeds; no hydration errors in browser console |
| #11 Share URL abuse | Phase 5 (share/distribute) | Verify denylist blocks test celebrity name; verify report-button takes scene down |
| #12 API key juggling | Phase 0 (setup) + demo prep | `vercel env ls` shows all keys; demo machine has tested deployment 24h prior |

---

## Sources

### Voice cloning ethics & legal
- [2Wai Backlash and Ethical Debate - The Modems](https://themodems.com/tech/2wai-controversial-ai-avatar-app-talk-deceased-relatives/) — 2wai controversy, 40.9M view ad, "objectively one of the most evil ideas imaginable"
- [2Wai AI Avatars Backlash - Open Tools](https://opentools.ai/news/new-ai-app-2wai-raises-eyebrows-by-reviving-deceased-relatives-as-digital-avatars) — exploitative commercialization of grief framing
- [ElevenLabs Fresh Lawsuit by Journalists - Sifted](https://sifted.eu/articles/elevenlabs-lawsuit-2026) — May 2026 Illinois lawsuit by 7 journalists/voice actors
- [Senator Hassan Demands Voice Cloning Answers - Lars Daniel](https://www.thelarsdaniel.com/senator-hassan-demands-answers-from-voice-cloning-companies-after-fbi-reports-893-million-in-ai-voice-scams/) — FBI $893M AI voice scam loss report
- [ElevenLabs Voice Cloning Consent Policy 2025 - Marga Bagus](https://margabagus.com/elevenlabs-voice-cloning-consent-2025/) — California AB 2602 + AB 1836 for deceased performers
- [Attack of the Voice Clones - Blank Rome](https://www.blankrome.com/publications/attack-voice-clones-protecting-right-your-voice) — right-of-publicity legal analysis
- [Voice Cloning Concepts - ElevenLabs Docs](https://elevenlabs.io/docs/eleven-api/concepts/voice-cloning) — voice-captcha consent verification
- [ElevenLabs Compliance Checklist 2026 - Marga Bagus](https://margabagus.com/elevenlabs-voice-cloning-consent/) — compliance checklist

### Stripe webhooks & billing
- [Stripe Webhooks Complete Implementation Guide 2026 - Hooklistener](https://www.hooklistener.com/learn/stripe-webhooks-implementation) — idempotency patterns
- [Stripe Webhook Best Practices - HookRay](https://hookray.com/blog/stripe-webhook-best-practices-2026) — four requirements: signature, idempotency, fast 2xx, replay
- [Stripe Webhook Idempotency - HookReplay](https://hookreplay.dev/blog/webhook-idempotency) — duplicate event handling
- [Stripe Test Mode and Going Live - SendOwl](https://www.sendowl.com/blog/tips-and-advice/stripe-test-mode-going-live) — test vs live separation
- [Stripe Usage-Based Billing Implementation 2026 - StarterPick](https://starterpick.com/blog/how-to-add-usage-based-billing-stripe-2026) — Meter object required as of 2025-03-31.basil
- [Stripe Receive Events - Official Docs](https://docs.stripe.com/webhooks) — official webhook patterns

### Vercel & Next.js
- [Vercel Functions Limits - Official](https://vercel.com/docs/functions/limitations) — 300s Pro max for standard serverless, 800s for Fluid Compute Pro
- [Vercel Fluid Compute - Official](https://vercel.com/docs/fluid-compute) — `after()` API + 14 minutes paid plans
- [Inngest Vercel Timeout Solutions](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts) — async job patterns for Next.js
- [Configuring Vercel Function Duration - Official](https://vercel.com/docs/functions/configuring-functions/duration) — maxDuration export

### Three.js, R3F, Gaussian Splat
- [R3F Performance Scaling - Official Docs](https://r3f.docs.pmnd.rs/advanced/scaling-performance) — frameloop demand, dpr, performance monitor
- [SPZ Format Niantic Labs](https://github.com/nianticlabs/spz) — 10x smaller, mobile-friendly
- [3DGS Formats Compared - Polyvia3D](https://www.polyvia3d.com/formats/gaussian-splatting-formats) — PLY/SPLAT/SPZ/KSPLAT all WebGL2 compatible
- [WebGL Issues on iOS Safari Three.js Forum](https://discourse.threejs.org/t/safari-any-web-browser-crash-on-iphone-when-use-webgl/81629) — WebGL crashes on iPhone Safari
- [Three.js iOS 16.4 Issues - GitHub](https://github.com/mrdoob/three.js/issues/25741) — Safari memory pressure
- [Hydration Errors in Next.js - Dev.to](https://dev.to/rahucode/hydration-errors-in-reactjs-and-nextjs-what-why-and-how-to-fix-them-2m15) — SSR mismatch patterns
- [GaussianSplats3D Three.js Implementation](https://github.com/mkkellogg/GaussianSplats3D) — splat sort performance considerations

### World Labs, FAL, Hunyuan3D
- [World Labs API Pricing - Official](https://docs.worldlabs.ai/api/pricing) — $1.20/world for Marble 1.1, 1500 credits each
- [Marble 1.1 Release Notes - Radiance Fields](https://radiancefields.com/world-labs-releases-marble-1.1-and-marble-1.1-plus) — Marble 1.1 Plus cubes pricing
- [Hunyuan3D v2 FAL.ai](https://fal.ai/models/fal-ai/hunyuan3d/v2) — $0.16/generation, 50K-1.5M face range
- [Hunyuan3D v3 Pro FAL.ai](https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/pro/image-to-3d) — $0.375/generation Pro tier
- [Image-Blaster Repo - Neilson](https://github.com/neilsonnn/image-blaster) — pipeline architecture and timing

### Hackathon & demo practices
- [Hackathon Demo Video Tips - Devpost](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video) — elevator pitch first, judges scan quickly
- [Hackathon Pitfalls - MIT Sloan](https://sloanreview.mit.edu/article/avoid-these-five-pitfalls-at-your-next-hackathon/) — scope management
- [Killer Hackathon Demo - Nader Dabit](https://gist.github.com/dabit3/caef5eee4753dd7d23767bc31e70da28) — pitch structure

### ElevenLabs production
- [ElevenLabs Production Limits at Scale - Deepgram](https://deepgram.com/learn/elevenlabs-production-limits-concurrency-credits-compliance) — concurrency caps, real cost = 2.8x advertised
- [ElevenLabs Pricing 2026 - Cekura](https://www.cekura.ai/blogs/elevenlabs-pricing) — character billing, model variants
- [ElevenLabs Rate Limits - Prosperasoft](https://prosperasoft.com/blog/voice-synthesis/elevenlabs/elevenlabs-api-rate-limits/) — 429 handling
- [ElevenLabs IVC Docs](https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/instant-voice-cloning) — IVC consent flow

### DMCA & content moderation
- [DMCA Best Practices for Fediverse - EFF](https://www.eff.org/deeplinks/2026/04/copyright-and-dmca-best-practices-fediverse-operators) — safe harbor requirements
- [SCOTUS Limits Contributory Liability - Morgan Lewis](https://www.morganlewis.com/pubs/2026/04/scotus-limits-contributory-copyright-liability-for-internet-service-providers) — recent platform liability decisions

---
*Pitfalls research for: Living Photos (image-to-walkable-3D + voice cloning + Stripe hackathon project)*
*Researched: 2026-05-15*
*Confidence: HIGH on legal/Stripe/Vercel patterns, MEDIUM on Hunyuan3D content edge cases (no official policy docs found)*
