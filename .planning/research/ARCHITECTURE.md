# Architecture Research

**Domain:** AI-orchestrated photo-to-3D-scene web app with payment + voice clone
**Researched:** 2026-05-15
**Confidence:** HIGH (Vercel limits, Inngest pattern, R3F SSR, Stripe webhook are all well-documented; image-blaster orchestration confirmed against repo README)

## TL;DR — The Core Architectural Decision

The single most important decision: **do NOT spawn the image-blaster CLI from a Vercel function.** Instead, port image-blaster's orchestration logic into **Inngest step functions** that call the same upstream APIs (World Labs Marble, FAL Hunyuan3D, ElevenLabs SFX) directly from TypeScript. This is feasible because every dependency image-blaster uses is already a remote HTTP API — image-blaster is itself a thin TS orchestrator, not a heavyweight binary. This sidesteps Vercel's serverless filesystem constraints, the 300s function timeout, and the 250 MB function bundle limit, and gives us native step-level retries, webhooks, and real-time progress streaming for free.

The runtime architecture is then: **Next.js (UI + API routes) → Inngest (job orchestration) → upstream AI APIs (Marble/FAL/ElevenLabs) → Vercel Blob (assets) → Postgres (state) → Three.js viewer (delivery).**

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │  Upload UI   │  │ Progress UI  │  │ R3F Viewer   │                    │
│  │ (dropzone)   │  │ (realtime)   │  │ (.spz+.glb)  │                    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                    │
│         │                  │ Inngest         │ /scene/[slug]              │
│         │                  │ Realtime hook   │ (dynamic, ssr:false)       │
└─────────┼──────────────────┼─────────────────┼────────────────────────────┘
          │                  │                 │
          ▼                  ▼                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER (Vercel)                            │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                 │
│  │ /api/scenes   │  │ /api/inngest  │  │ /api/webhooks │                 │
│  │ POST (create) │  │ Inngest entry │  │ /stripe       │                 │
│  │ GET (poll)    │  │ point         │  │ /fal          │                 │
│  └──────┬────────┘  └───────┬───────┘  └───────┬───────┘                 │
│         │                   │                  │                          │
│         │ enqueue event     │ register fns     │ verify + update         │
└─────────┼───────────────────┼──────────────────┼──────────────────────────┘
          │                   │                  │
          ▼                   ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     INNGEST (Job Orchestrator)                            │
│  scene.generate function:                                                 │
│    step.run("upload-image")    → Vercel Blob                              │
│    step.run("call-marble")     → World Labs API (async)                   │
│    step.waitForEvent("marble-done")  ← webhook                            │
│    step.run("detect-objects")  → vision model (optional)                  │
│    step.run("call-hunyuan-N")  → FAL queue (parallel, with waits)         │
│    step.run("call-elevenlabs-sfx") → ambient + per-object audio           │
│    step.run("publish")         → mark scene ready, notify viewer          │
└──────────────────────────────────────────────────────────────────────────┘
          │                   │                  │
          ▼                   ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL AI SERVICES                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │ World Labs │  │ FAL Hunyuan│  │ ElevenLabs │  │ ElevenLabs │          │
│  │ Marble 1.1 │  │ 3D v2.1    │  │ SFX (audio)│  │ IVC (voice)│          │
│  │ → .spz     │  │ → .glb     │  │ → .mp3     │  │ → voice_id │          │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘          │
└──────────────────────────────────────────────────────────────────────────┘
          │                                                  │
          ▼                                                  ▼
┌─────────────────────────────────────┐  ┌─────────────────────────────────┐
│        PERSISTENCE LAYER             │  │      PAYMENT LAYER               │
│  ┌──────────────┐  ┌──────────────┐  │  │  ┌──────────────────────────┐   │
│  │ Vercel Blob  │  │  Postgres    │  │  │  │ Stripe Checkout Session   │   │
│  │ (.spz/.glb/  │  │ (Supabase or │  │  │  │ + Webhook listener        │   │
│  │  .mp3 assets)│  │  Neon)       │  │  │  │ + Customer / Subscription │   │
│  └──────────────┘  └──────────────┘  │  │  └──────────────────────────┘   │
└─────────────────────────────────────┘  └─────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Upload UI** | Accept photo, voice sample, consent attestation | Client component, `react-dropzone`, direct upload to Vercel Blob via signed URL |
| **Progress UI** | Show pipeline stages, real-time progress, ETA | `useInngestSubscription` React hook from `@inngest/realtime` |
| **R3F Viewer** | Render walkable splat scene + meshes + audio | `next/dynamic` import with `ssr:false`, Spark.js for SPZ rendering |
| **`/api/scenes`** | Create scene record, kick off Inngest event | Next.js route handler, calls `inngest.send()` |
| **`/api/inngest`** | Inngest's serve entry point (function registry) | Single route handler that Inngest invokes per step |
| **`/api/webhooks/stripe`** | Verify Stripe signature, mark scene as paid | Next.js route handler, raw body, signature check |
| **`/api/webhooks/fal`** | Receive FAL queue completion notifications | Forwards into Inngest as event (`fal.job.completed`) |
| **Inngest orchestrator** | Run the 4-5 minute pipeline as resumable steps | One `scene.generate` function with ~7 named steps |
| **Postgres (Supabase/Neon)** | Source of truth for scenes, voice clones, payments | Drizzle ORM, single database |
| **Vercel Blob** | Asset hosting (.spz, .glb, .mp3, source photo) | Client-direct upload + public URLs for viewer |
| **Stripe** | Payment processing, subscription state | Checkout Sessions + Billing Meters |

---

## Recommended Project Structure

```
living-photos/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                       # Landing page
│   │   └── pricing/page.tsx               # Pricing
│   ├── create/
│   │   ├── page.tsx                       # Upload flow (client)
│   │   └── _components/
│   │       ├── photo-dropzone.tsx
│   │       ├── voice-consent-form.tsx
│   │       └── pipeline-progress.tsx      # useInngestSubscription
│   ├── scene/
│   │   └── [slug]/
│   │       ├── page.tsx                   # Server: load metadata, gate by paid status
│   │       ├── _viewer.tsx                # 'use client' wrapper
│   │       └── _viewer-dynamic.tsx        # dynamic(() => …, {ssr:false})
│   ├── api/
│   │   ├── scenes/
│   │   │   ├── route.ts                   # POST create, GET list
│   │   │   └── [id]/route.ts              # GET single, polling fallback
│   │   ├── inngest/route.ts               # Inngest serve()
│   │   ├── upload/route.ts                # Vercel Blob signed-URL issuer
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts          # Create Checkout Session
│   │   │   └── portal/route.ts            # Customer portal link
│   │   └── webhooks/
│   │       ├── stripe/route.ts            # signature-verified handler
│   │       ├── fal/route.ts               # FAL → Inngest bridge
│   │       └── marble/route.ts            # Marble → Inngest bridge
│   └── layout.tsx
├── inngest/
│   ├── client.ts                          # Inngest client instance
│   ├── functions/
│   │   ├── scene-generate.ts              # The 4-5 min pipeline
│   │   ├── voice-clone.ts                 # IVC creation flow
│   │   └── scene-publish.ts               # Post-payment unlock side-effects
│   └── events.ts                          # TypeScript event schema
├── lib/
│   ├── db/
│   │   ├── schema.ts                      # Drizzle schema (see below)
│   │   ├── client.ts                      # Connection pool
│   │   └── queries/                       # Typed query helpers
│   ├── ai/
│   │   ├── marble.ts                      # World Labs client
│   │   ├── fal.ts                         # FAL Hunyuan client
│   │   ├── elevenlabs.ts                  # SFX + IVC clients
│   │   └── prompts.ts                     # Shared prompt strings
│   ├── stripe/
│   │   ├── client.ts
│   │   └── checkout.ts                    # Session creation helpers
│   ├── blob/
│   │   └── upload.ts                      # Signed URL + public URL helpers
│   └── consent/
│       └── verify.ts                      # Voice consent attestation
├── components/
│   ├── ui/                                # shadcn/ui generated
│   └── viewer/
│       ├── splat-canvas.tsx               # Spark.js wrapper
│       ├── object-meshes.tsx              # GLB renderers
│       ├── ambient-audio.tsx              # SFX + narration playback
│       └── walk-controls.tsx              # Constrained "cone" navigation
├── drizzle/                               # generated migrations
├── public/
└── package.json
```

### Structure Rationale

- **`app/(marketing)/` vs `app/create/` vs `app/scene/[slug]/`:** Three distinct user journeys with different rendering models. Marketing is static + ISR. Create is client-heavy (uploads, real-time progress). Scene is server-rendered metadata + dynamic client viewer.
- **`inngest/functions/`:** Keep job definitions separate from API routes so they're reusable, testable, and explicit. Inngest functions are the *backend service layer* — API routes are thin.
- **`lib/ai/`:** One module per upstream service so each can be mocked/swapped independently. Critical for tests since we can't run Marble in CI.
- **`lib/blob/`:** Signed-URL issuance must be a single chokepoint so we don't accidentally expose write access.
- **`components/viewer/`:** R3F components live outside `app/` so they can be imported from multiple scene routes (e.g., embed widget, social share preview) without coupling to App Router.

---

## Architectural Patterns

### Pattern 1: Inngest Step Functions for the 4-5 Minute Pipeline

**What:** Decompose the generation pipeline into named `step.run()` blocks. Each step runs as its own Vercel function invocation (well under the 300s limit), and Inngest persists state between them. The *overall* function can run for many minutes (hours, even) — Vercel only sees a series of short invocations.

**When to use:** Any workflow that exceeds Vercel's serverless timeout — non-negotiable for a 4-5 minute generation. Step boundaries become natural retry boundaries and natural progress checkpoints.

**Trade-offs:**
- ✓ No timeout pressure, automatic retries with exponential backoff, free state persistence, real-time progress via channels
- ✓ Vendor offers a generous free tier (50k runs/month, 5 concurrent steps) — sufficient for hackathon + early beta
- ✗ Adds an external dependency and dashboard
- ✗ Free-tier 5-concurrent-step cap means parallel object-mesh generation must be throttled or queued
- ✗ Step inputs/outputs are JSON-serialized → don't pass file buffers between steps, pass blob URLs

**Example:**
```typescript
// inngest/functions/scene-generate.ts
export const sceneGenerate = inngest.createFunction(
  { id: "scene-generate", concurrency: { limit: 3 } },
  { event: "scene.upload.received" },
  async ({ event, step, publish }) => {
    const { sceneId, photoUrl, voiceCloneId } = event.data;

    await publish({ channel: `scene:${sceneId}`, topic: "stage", data: "splat-starting" });

    // 1. Kick off Marble. Marble is async + we will not block.
    const marbleJob = await step.run("submit-marble", () =>
      marble.submit({ image_url: photoUrl, webhook: marbleWebhookUrl })
    );

    // 2. Wait for Marble webhook → emits 'marble.completed' event with sceneId.
    const marbleResult = await step.waitForEvent("marble-done", {
      event: "marble.completed",
      if: `event.data.sceneId == "${sceneId}"`,
      timeout: "10m",
    });

    if (!marbleResult) throw new NonRetriableError("Marble timed out");

    await publish({ channel: `scene:${sceneId}`, topic: "stage", data: "objects-starting" });

    // 3. Generate object meshes in parallel (capped by free-tier concurrency).
    const objects = await step.run("detect-objects", () =>
      detectObjects(photoUrl) // vision model returns N object descriptors
    );

    const meshes = await Promise.all(
      objects.map((obj, i) =>
        step.run(`mesh-${i}`, () => fal.hunyuan3d.generate(obj))
      )
    );

    // 4. SFX. Cheap & fast.
    await publish({ channel: `scene:${sceneId}`, topic: "stage", data: "audio-starting" });
    const ambient = await step.run("sfx-ambient", () => elevenlabs.sfx(ambientPrompt(objects)));
    const objectSfx = await Promise.all(
      objects.map((o, i) => step.run(`sfx-${i}`, () => elevenlabs.sfx(o.soundPrompt)))
    );

    // 5. (Optional) Generate voice narration if a voice clone was provided.
    let narration: string | null = null;
    if (voiceCloneId) {
      narration = await step.run("narration", () =>
        elevenlabs.tts({ voiceId: voiceCloneId, text: narrationScript(objects) })
      );
    }

    // 6. Persist final scene record.
    await step.run("publish", () =>
      db.update(scenes).set({
        status: "ready",
        splatUrl: marbleResult.data.spzUrl,
        meshUrls: meshes.map(m => m.glbUrl),
        ambientUrl: ambient,
        objectSfxUrls: objectSfx,
        narrationUrl: narration,
        completedAt: new Date(),
      }).where(eq(scenes.id, sceneId))
    );

    await publish({ channel: `scene:${sceneId}`, topic: "stage", data: "ready" });
  }
);
```

### Pattern 2: Webhook → Event Bridge (No CLI Spawning)

**What:** Upstream services (Marble, FAL) finish asynchronously and call our webhook. The webhook handler does only one thing: validate signature, then forward the payload into Inngest as a typed event. The waiting `step.waitForEvent()` resumes automatically.

**When to use:** Any time an upstream service offers webhooks. Always prefer over polling.

**Trade-offs:**
- ✓ Zero polling cost, instant resumption, no timeout risk
- ✓ Trivial to test (replay a webhook into Inngest locally)
- ✗ Requires public HTTPS endpoint (Vercel preview URLs work; for local dev use Inngest Dev Server + ngrok or `stripe listen` equivalent for FAL)

**Example:**
```typescript
// app/api/webhooks/fal/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get("x-fal-signature");
  const body = await req.text();
  if (!verifyFalSignature(body, sig)) return new Response("invalid", { status: 401 });

  const payload = JSON.parse(body);
  // Translate FAL's request_id back to our scene+step.
  await inngest.send({
    name: "fal.job.completed",
    data: { requestId: payload.request_id, output: payload.payload }
  });
  return Response.json({ ok: true });
}
```

### Pattern 3: Dynamic R3F Canvas with SSR Disabled

**What:** Three.js touches `window` and `document` on import. Server-rendering it will crash or produce hydration mismatches. Wrap the canvas component in `next/dynamic` with `ssr: false` and load it from a server component that has already verified the scene is ready and paid.

**When to use:** Every R3F surface in a Next.js App Router app. There is no exception worth taking the risk for.

**Trade-offs:**
- ✓ Eliminates an entire class of hydration bugs
- ✓ Allows the server route to do real auth/payment gating before any 3D code runs
- ✗ Adds ~1 client roundtrip; mitigate with a Suspense skeleton

**Example:**
```typescript
// app/scene/[slug]/page.tsx  (Server Component)
import { notFound, redirect } from "next/navigation";
import SceneViewerDynamic from "./_viewer-dynamic";

export default async function ScenePage({ params }: { params: { slug: string } }) {
  const scene = await db.query.scenes.findFirst({ where: eq(scenes.slug, params.slug) });
  if (!scene) notFound();
  if (scene.status !== "ready") return <PipelineStatusPage sceneId={scene.id} />;
  if (!scene.paid) redirect(`/scene/${params.slug}/checkout`);
  return <SceneViewerDynamic scene={scene} />;
}

// app/scene/[slug]/_viewer-dynamic.tsx  ('use client')
"use client";
import dynamic from "next/dynamic";
const SceneViewer = dynamic(() => import("@/components/viewer/splat-canvas"), { ssr: false });
export default SceneViewer;
```

### Pattern 4: Stripe Checkout Session with sceneId in Metadata

**What:** Don't try to wire Stripe success URLs to do anything authoritative — they're spoofable. Instead, put the `sceneId` in the Checkout Session's `metadata`, and let the `checkout.session.completed` webhook update the database. The success page just reads from the DB.

**When to use:** Every Stripe Checkout integration. Universal pattern.

**Trade-offs:**
- ✓ Tamper-proof, idempotent (use the event ID as a dedupe key)
- ✗ Slight delay between user landing on success page and the DB reflecting payment — handle with a polling loop or `useInngestSubscription` on `scene:{id}` channel

**Example:**
```typescript
// app/api/stripe/checkout/route.ts
export async function POST(req: Request) {
  const { sceneId } = await req.json();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.STRIPE_PRICE_ONETIME!, quantity: 1 }],
    success_url: `${origin}/scene/${slug}?paid=true`,
    cancel_url: `${origin}/scene/${slug}?cancel=true`,
    metadata: { sceneId },                    // ← critical
  });
  return Response.json({ url: session.url });
}

// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    await db.update(scenes).set({ paid: true, paidAt: new Date() })
                         .where(eq(scenes.id, s.metadata.sceneId!));
  }
  return Response.json({ received: true });
}

export const config = { runtime: "nodejs" }; // signature verification needs raw body
```

### Pattern 5: Voice Consent Gate as a Verifiable Artifact

**What:** Before invoking ElevenLabs IVC for a voice that isn't matched to the uploader, the user records a *live* attestation ("I, [name], on [date], consent to clone the voice of [subject]…"). This attestation audio and a transcript are stored alongside the voice clone record. The IVC call is gated behind this evidence existing in the DB.

**When to use:** Any voice clone scenario. Hardcoded into the data model, not a UX afterthought.

**Trade-offs:**
- ✓ Defensible compliance posture for EU AI Act / ELVIS Act / ElevenLabs ToS
- ✓ Simple to enforce — single FK from `voice_clones.consent_artifact_id`
- ✗ Adds ~30s to onboarding for non-self voice clones; that's the cost of being ethical

---

## Data Flow

### End-to-End Request Flow

```
1. UPLOAD (synchronous, ~3s)
   User → /create form
       → POST /api/upload  (issues Vercel Blob signed URL)
       → Browser uploads photo directly to Blob
       → POST /api/scenes { photoUrl, voiceConsent? }
         ├─ INSERT scenes row (status='queued', slug=nanoid(10))
         └─ inngest.send("scene.upload.received", {sceneId, photoUrl})
       → Response { sceneId, slug }
       → Browser navigates to /scene/{slug}

2. ORCHESTRATION (asynchronous, ~4-5 min)
   Inngest scene-generate function runs across multiple step invocations:
     step.run "submit-marble"            (~5s)   → Marble queued
     step.waitForEvent "marble-done"     (~3m)   ← Marble webhook fires
       /api/webhooks/marble → inngest.send("marble.completed")
     step.run "detect-objects"           (~10s)
     step.run "mesh-0..N" (parallel)     (~60s)  → FAL queued
       /api/webhooks/fal → inngest.send("fal.job.completed")
       (step.waitForEvent resumes each mesh)
     step.run "sfx-ambient" + "sfx-N"    (~15s)
     step.run "narration" (optional)     (~10s)
     step.run "publish"                  → UPDATE scenes SET status='ready'
     publish({channel: `scene:${id}`, topic: "stage", data: "ready"})

3. PROGRESS (realtime, parallel to orchestration)
   Browser on /scene/{slug}:
     useInngestSubscription({channel: `scene:${sceneId}`})
       → Renders progress stages as `publish()` calls fire
       → On "ready" stage, transitions to checkout (if unpaid) or viewer

4. PAYMENT (synchronous, ~5s)
   User clicks "Save forever — $19"
       → POST /api/stripe/checkout {sceneId}
       → 303 to Stripe-hosted Checkout
       → User pays, Stripe → /api/webhooks/stripe (checkout.session.completed)
         └─ UPDATE scenes SET paid=true WHERE id=metadata.sceneId
       → Redirect to /scene/{slug}?paid=true
       → Page re-fetches scene → paid=true → renders viewer

5. VIEW (delivery)
   /scene/{slug} (server):
     SELECT scene WHERE slug=… → check status='ready' AND paid=true
     → Render <SceneViewerDynamic scene={scene}/>
     → Browser dynamic-imports R3F bundle
     → Spark.js fetches scene.splatUrl (.spz from Blob)
     → R3F loads each scene.meshUrls[].glb
     → <audio> elements stream ambient + narration
```

### Database Schema Sketch

```typescript
// lib/db/schema.ts (Drizzle / PostgreSQL)
export const scenes = pgTable("scenes", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 12 }).notNull().unique(),     // nanoid(10), e.g. "h3K2pQrLm4"
  userId: uuid("user_id").references(() => users.id),           // nullable for anon
  email: varchar("email", { length: 255 }),                     // captured at checkout
  status: pgEnum("scene_status", ["queued","running","ready","failed"])("status").notNull().default("queued"),
  errorMessage: text("error_message"),
  // Inputs
  sourcePhotoUrl: text("source_photo_url").notNull(),
  voiceCloneId: uuid("voice_clone_id").references(() => voiceClones.id),
  // Outputs
  splatUrl: text("splat_url"),               // Vercel Blob: .spz
  splatLowPolyUrl: text("splat_low_poly_url"), // for mobile share
  meshUrls: jsonb("mesh_urls").$type<{label: string; url: string}[]>(),
  ambientAudioUrl: text("ambient_audio_url"),
  objectAudioUrls: jsonb("object_audio_urls").$type<{label: string; url: string}[]>(),
  narrationAudioUrl: text("narration_audio_url"),
  // Payment gate
  paid: boolean("paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  // Pipeline tracking
  inngestRunId: text("inngest_run_id"),
  marbleJobId: text("marble_job_id"),
  generationCostCents: integer("generation_cost_cents"),   // for unit-econ tracking
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const voiceClones = pgTable("voice_clones", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  // ElevenLabs side
  elevenLabsVoiceId: varchar("elevenlabs_voice_id", { length: 64 }).notNull(),
  // Inputs
  sampleAudioUrl: text("sample_audio_url").notNull(),
  // Consent (gates IVC API call)
  consentArtifactUrl: text("consent_artifact_url").notNull(),  // recorded live attestation
  consentTranscript: text("consent_transcript").notNull(),
  consentVerifiedAt: timestamp("consent_verified_at").notNull(),
  selfVoiceMatch: boolean("self_voice_match").notNull().default(false), // bypass if uploader's own
  // Lifecycle
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),                           // GDPR / user-requested deletion
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  sceneId: uuid("scene_id").references(() => scenes.id),
  userId: uuid("user_id").references(() => users.id),
  email: varchar("email", { length: 255 }),
  // Stripe
  stripeEventId: varchar("stripe_event_id", { length: 128 }).notNull().unique(), // idempotency
  stripeCustomerId: varchar("stripe_customer_id", { length: 64 }),
  stripeSessionId: varchar("stripe_session_id", { length: 128 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 64 }),
  // Amount
  product: pgEnum("payment_product", ["scene_onetime","family_yearly","lifetime"])("product").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  // Lifecycle
  status: pgEnum("payment_status", ["pending","succeeded","refunded","disputed"])("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 64 }),
  plan: pgEnum("plan", ["free","family_yearly","lifetime"])("plan").notNull().default("free"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

**Indexing notes:**
- `scenes.slug` UNIQUE — every viewer page query hits this
- `scenes.userId` for "my scenes" dashboard
- `scenes.status, scenes.createdAt` for ops queries
- `payments.stripeEventId` UNIQUE — webhook idempotency

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Hackathon demo (0-50 scenes)** | Vercel free + Inngest free + Vercel Blob + Supabase free. Single region. No CDN tuning. Costs: <$50 in API spend. |
| **Early validation (50-500 scenes)** | Same stack, upgrade Vercel to Pro for 300s function timeout buffer (Inngest still does the heavy lifting). Inngest free tier (50k runs/mo) still ample. Add Sentry for error tracking. |
| **Beta (500-5k scenes/mo)** | Move splat assets to Cloudflare R2 (zero egress) — Vercel Blob egress would dominate cost at this point. Add background job to generate LowPoly variants for mobile. Inngest Cloud paid plan ($25-100/mo) for parallel concurrency beyond 5 steps. |
| **Scale (5k+ scenes/mo)** | Consider self-hosting Inngest (open-source), dedicated GPU inference (Modal/Runpod) for object meshing if FAL pricing becomes a problem. Multi-region read replicas for Postgres. |

### Scaling Priorities — What Breaks First

1. **Vercel Blob egress costs** at ~1k scenes/month. A .spz can be 30-100 MB; if each scene is viewed by 10 friends, egress is $0.05 × 100 MB × 1k × 10 = $50/mo per 1k scenes generated — small but grows fast. **Mitigation:** migrate to Cloudflare R2 (zero egress) before this hurts.
2. **Inngest free-tier concurrency (5 steps)** when ~3 scenes generate in parallel. Each scene fans out N=3-7 mesh steps. **Mitigation:** Inngest paid plan ($25/mo unlocks 25 concurrent steps), or cap user-visible concurrency.
3. **Upstream API rate limits** (FAL, Marble, ElevenLabs). All three have account-level QPS caps. **Mitigation:** queue with `step.sleep()` between submissions, surface real waits to users.
4. **Mobile WebGL OOM** at .spz > 1M gaussians. **Mitigation:** generate LowPoly variants up-front (Hunyuan supports this natively) and serve them via UA sniffing.

---

## Anti-Patterns

### Anti-Pattern 1: Spawning the image-blaster CLI from a Vercel function

**What people do:** "It's a CLI, let's `child_process.spawn()` it inside an API route." Bundles the Node binary, hits the 250 MB function size limit, gets killed at 300s anyway because the pipeline is 4-5 minutes, can't write to a non-`/tmp` filesystem, no progress visibility, no retries.
**Why it's wrong:** Vercel functions have read-only filesystems (except 500 MB `/tmp`), 300s max duration on Pro (800s on Fluid Compute), 250 MB unzipped bundle, and no persistent state between cold starts.
**Do this instead:** Port image-blaster's orchestration TypeScript directly into Inngest functions. All of image-blaster's *dependencies* are remote APIs — we don't lose any capability. We gain retries, observability, real-time progress, and step-level testability.

### Anti-Pattern 2: Polling Marble/FAL from a Next.js route

**What people do:** API route receives upload → calls Marble → `while (status !== "done") { await sleep(5000); poll(); }`. Times out at 60s.
**Why it's wrong:** Even with the longest Vercel timeout, polling burns function compute and ties up a request. And it doesn't survive deploys/restarts.
**Do this instead:** Submit the job with a `webhookUrl` parameter pointing to `/api/webhooks/{marble,fal}/`. Use `step.waitForEvent()` in Inngest. The orchestrator function literally sleeps until the webhook arrives. Zero polling cost.

### Anti-Pattern 3: Trusting Stripe success_url for payment state

**What people do:** "If they hit /success, they paid. Mark the scene as paid in the success page handler."
**Why it's wrong:** Anyone can forge a request to `/success`. The URL is in plain HTML the user can see.
**Do this instead:** Use `checkout.session.completed` webhook with signature verification. The success page just reads from the DB (which the webhook has authoritatively updated). Surface a brief "Processing payment…" state if the user lands before the webhook fires (rare; usually <1s).

### Anti-Pattern 4: Server-rendering the R3F canvas

**What people do:** Drop `<Canvas>` into a Server Component. Build crashes with `window is not defined`.
**Why it's wrong:** Three.js touches DOM globals on module import. R3F 9.x is required for React 19; even then, the canvas must be client-only.
**Do this instead:** `dynamic(() => import("./viewer"), { ssr: false })`. Render a skeleton on the server. Auth/payment gating happens in the server component, so the dynamic import only loads for authorized viewers.

### Anti-Pattern 5: Storing voice consent as a boolean

**What people do:** `voice_clones.consent_given: boolean`. Checked a checkbox? You're good.
**Why it's wrong:** ElevenLabs ToS requires that we can *document* consent. EU AI Act and Tennessee ELVIS Act explicitly demand verifiable artifacts. A boolean is not evidence.
**Do this instead:** Store the live attestation audio + transcript as required FKs (`consent_artifact_url`, `consent_transcript`, `consent_verified_at`). IVC API call is gated on these existing. For the uploader's own voice, allow a self-voice-match bypass (compare uploaded sample to a live mic test).

### Anti-Pattern 6: Storing the .spz file in Postgres / database

**What people do:** Convenience! Just `bytea` columns!
**Why it's wrong:** .spz files are 30-100 MB. Postgres is not designed for blob storage at this scale; it kills your backup performance, query latency, and connection pool throughput.
**Do this instead:** Vercel Blob (or R2). Store the public URL in Postgres. Cleanup is a cron that deletes blob refs for `scenes` rows older than X without payment.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes / Gotchas |
|---------|---------------------|----------------|
| **World Labs Marble 1.1** | `fetch("/marble/v1/worlds:generate", {webhook})` → wait for webhook → fetch `.spz` URL from response | Public API GA'd Jan 2026. Waitlist for API keys ~24h. Returns 500k / 100k / full_res variants — pick by device class. |
| **FAL Hunyuan3D v2.1** | `fal.queue.submit("fal-ai/hunyuan3d-v21", {webhookUrl})` → webhook → output is GLB URL | Throttle parallel submissions (account QPS). Default 50k faces is fine; offer LowPoly variant for mobile in future. |
| **ElevenLabs SFX** | Direct HTTP POST, blocking (~5-10s response). No webhook needed. | Cheap (~$0.10/scene for ambient + 5 object SFX). Can run synchronously inside an Inngest step. |
| **ElevenLabs IVC** | POST audio sample + name → returns `voice_id` in seconds. Gate behind consent_artifact in DB. | IVC is fast (no training). PVC takes hours — not for hackathon. Store voice_id; clones can be deleted via API for GDPR. |
| **Stripe Checkout** | Server-create Session with `metadata.sceneId` → 303 to hosted page → webhook `checkout.session.completed` | Use raw body in webhook (Edge runtime drops body — must declare `runtime: "nodejs"`). Idempotency by `stripeEventId UNIQUE`. |
| **Stripe Billing Meters** | Defer — only needed when usage-based subscription overage shipping. Family plan starts as fixed price recurring. | Hackathon scope: one-time $19. Defer subscription to post-demo. |
| **Vercel Blob** | Client-direct upload via signed URL from `/api/upload`. Public URL returned for asset serving. | Public access mode is fine for delivered assets (paid scenes are gated server-side before exposing URLs). |
| **Inngest** | `inngest.send("event.name", data)` from API route → handler in `inngest/functions/*` → realtime via `publish()` + `useInngestSubscription` | Free tier sufficient (50k runs/mo, 5 concurrent steps). Local dev: `npx inngest-cli dev`. |
| **Supabase Postgres** | Drizzle ORM + connection pool. Use pgbouncer/transaction mode for serverless. | Free tier (500 MB) is plenty. Auth not strictly needed for v1 — use email-only "magic link" via Supabase Auth when needed. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app/api/scenes/` ↔ `inngest/functions/` | Events (`inngest.send`) | One-way fire-and-forget. API never awaits the pipeline. |
| `inngest/functions/` ↔ `lib/ai/` | Direct function call | `lib/ai/*` exports plain async functions; Inngest steps wrap them. Keeps `lib/ai` testable in isolation. |
| `lib/ai/` ↔ external APIs | HTTPS + per-service SDK | Each service has one file; one place to swap implementations. |
| `app/scene/[slug]/` (server) ↔ `lib/db/` | Drizzle queries | Server components only — never call DB from client. |
| `components/viewer/` ↔ `app/scene/[slug]/` | Props (server → client) | Scene data passed as prop on first render. No client-side DB fetches in the viewer. |
| Browser ↔ Inngest realtime | `useInngestSubscription` over WebSocket | Subscription token issued by server on first render of `/scene/[slug]`. |

---

## Auth: Needed for v1?

**Recommendation: deferred OAuth, mandatory email-at-checkout.**

For v1 (hackathon + initial launch):
- **Anonymous creation flow.** No login required to upload a photo and watch generation. Reduces funnel friction sharply — the conversion lever is "watch the splat appear and *then* decide to pay."
- **Email captured at Stripe Checkout.** Stripe collects email natively. Webhook upserts a `users` row by email. This becomes their identity.
- **Magic-link login (Supabase Auth) for returning users.** Only needed for "my scenes" dashboard and the family yearly plan dashboard. Add post-MVP, not Day 1.
- **Anonymous scenes are claimable.** Anonymous `scenes` rows have `userId = null`. When user signs in with the same email later, claim all matching `scenes.email = user.email AND userId IS NULL` rows.

**Why not auth gate the create flow?** The viral mechanic is the share URL. Forcing signup before generation kills conversion. Magic link can be a post-payment confirmation step ("we sent your scene to anirudh@example.com — click to claim it on this device").

---

## Build Order Implications

Suggested phase sequence based on dependencies (each phase produces a demoable artifact):

1. **Foundation:** Next.js 15 + Tailwind + shadcn/ui + Drizzle + Supabase + Vercel Blob signed-upload route. Acceptance: upload photo, see URL in DB.
2. **Viewer:** R3F dynamic canvas + Spark.js + dummy .spz from image-blaster manual run. Acceptance: paste a known SPZ URL, walk through it on desktop + iPhone Safari.
3. **Inngest orchestration:** wire `scene.upload.received` → `submit-marble` → `wait` → `submit-fal` → `wait` → `sfx` → `publish`. Acceptance: upload triggers full pipeline, scene appears at `/scene/{slug}` automatically.
4. **Realtime progress UI:** `useInngestSubscription` on `/scene/{slug}` shows stages. Acceptance: user sees "Generating environment… 1/3 objects done…" live.
5. **Stripe Checkout + payment gate:** webhook updates `scenes.paid`. Viewer route 403s if unpaid. Acceptance: full pay-to-unlock flow works in test mode.
6. **Voice flow:** record consent attestation → IVC → narration in viewer. Acceptance: scene plays cloned voice as ambient narration.
7. **Share polish:** OpenGraph meta tags, mobile rendering, "open on phone" QR. Acceptance: friend opens link on iOS, sees scene, hears voice.
8. **Demo reel (optional):** server-side headless WebGL capture for 15s MP4. Defer if time-constrained — share URL on a phone is the demo.

Each phase is independently demoable, so we can ship-as-we-go and freeze whichever subset is hackathon-ready at the deadline.

---

## Async Job Pattern Recommendation — Final

**Choice: Inngest** (over Trigger.dev, Vercel Cron, custom polling, Modal).

**Rationale:**
- Image-blaster's pipeline is *exactly* the use case Inngest's step.run + step.waitForEvent was designed for: a multi-stage workflow that exceeds Vercel timeouts, with webhook-driven resumption.
- Free tier (50k runs/mo, 5 concurrent steps) is more than sufficient for the hackathon and initial validation — zero infra cost on day 1.
- The `useInngestSubscription` React hook plus `publish()` API gives us real-time progress UI for free; we don't have to build a separate polling/SSE layer.
- Native Vercel integration; our code stays in the Next.js repo.
- Step-level retries with exponential backoff cover the inherent flakiness of upstream AI services.

**Alternatives considered & rejected:**
- *Trigger.dev:* Equally capable; better DX in some respects. We choose Inngest because its realtime hooks are mature today and the Vercel integration is one-click. Either would work.
- *Vercel Cron + polling:* Doesn't fit — this is an event-driven pipeline, not a scheduled job. Crons every minute would be wasteful and slow.
- *Custom Redis/BullMQ:* Requires hosting Redis (Upstash, Railway, etc.) and writing the orchestration ourselves. Wrong tradeoff for a 3-day hackathon.
- *Modal/Runpod:* Optimized for GPU inference, which we don't need (Marble/FAL host the GPUs). Overkill for what is fundamentally an HTTP orchestrator.

---

## Sources

- [Vercel Functions Limits (official)](https://vercel.com/docs/functions/limitations)
- [Configuring Maximum Duration for Vercel Functions](https://vercel.com/docs/functions/configuring-functions/duration)
- [Serverless Functions can now run up to 5 minutes — Vercel changelog](https://vercel.com/changelog/serverless-functions-can-now-run-up-to-5-minutes)
- [Long-running background functions on Vercel — Inngest Blog](https://www.inngest.com/blog/vercel-long-running-background-functions)
- [Inngest Realtime: React hooks / Next.js docs](https://www.inngest.com/docs/features/realtime/react-hooks)
- [Inngest Usage Limits / Free Tier](https://www.inngest.com/docs/usage-limits/inngest)
- [Background Jobs in Next.js — Inngest vs Trigger.dev vs Vercel Cron (HashBuilds)](https://www.hashbuilds.com/articles/next-js-background-jobs-inngest-vs-trigger-dev-vs-vercel-cron)
- [FAL Queue API + webhooks reference](https://docs.fal.ai/model-apis/model-endpoints/queue)
- [Hunyuan3D v2.1 on FAL — API reference](https://fal.ai/models/fal-ai/hunyuan3d-v21/api)
- [World Labs Marble API Quickstart](https://docs.worldlabs.ai/api)
- [Announcing the World API — World Labs](https://www.worldlabs.ai/blog/announcing-the-world-api)
- [ElevenLabs Instant Voice Cloning docs](https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/instant-voice-cloning)
- [ElevenLabs Voice Cloning consent / ToS (margabagus 2026)](https://margabagus.com/elevenlabs-voice-cloning-consent/)
- [Vercel Blob — pricing & docs](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [3DGS Formats Compared: PLY vs SPLAT vs SPZ vs KSPLAT (Polyvia3D 2026)](https://www.polyvia3d.com/formats/gaussian-splatting-formats)
- [Spark.js — Gaussian Splatting renderer for Three.js](https://github.com/sparkjsdev/spark)
- [React Three Fiber Installation (Next.js dynamic + ssr:false)](https://r3f.docs.pmnd.rs/getting-started/installation)
- [Stripe Checkout and Webhook in a Next.js 15 (Medium, 2026)](https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e)
- [Drizzle ORM + Supabase tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase)
- [nanoid — URL-friendly unique ID generator](https://github.com/ai/nanoid)
- [image-blaster source repo (Neilson, MIT)](https://github.com/neilsonnn/image-blaster)

---
*Architecture research for: Living Photos (image-to-walkable-3D + voice clone + Stripe)*
*Researched: 2026-05-15*
