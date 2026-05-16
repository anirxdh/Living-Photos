# Stack Research

**Domain:** Consumer AI product — image → walkable 3D scene + cloned voice + Stripe payments + share URL
**Project:** Living Photos (Stripe + ElevenLabs hackathon, May 2026)
**Researched:** 2026-05-15
**Confidence:** HIGH (versions verified against npm/official docs; integration patterns verified against current vendor docs)

---

## TL;DR — The Prescribed Stack

> **Use Next.js 15.5 App Router + TypeScript 5.x + Tailwind v4.3 + shadcn/ui + R3F v9.6.1 + Spark.js for splats + ElevenLabs JS SDK 2.47 + Stripe Node 22.x + Vercel (Fluid Compute) + Neon Postgres + Drizzle ORM + Vercel Blob + Inngest for the 5-minute pipeline + Clerk for auth + Sentry + PostHog.**

The two decisions you must NOT get wrong:
1. **Splat rendering: use Spark.js, not GaussianSplats3D.** It's the only actively maintained .spz renderer for Three.js in 2026, has an R3F integration package, and World Labs itself uses it.
2. **Generation pipeline: do NOT run image-blaster inside a Next.js API route.** Generation takes 4-5 minutes — Vercel's Hobby tier caps at 60s and Pro at 800s with Fluid Compute. Use Inngest (or Trigger.dev) for the job orchestration; the Next.js route is a thin trigger that returns a job ID.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | `15.5.x` (App Router) | Web framework | Constraint-mandated. Pinning to 15.5 (not 16): 16 went stable Oct 2025 with Turbopack default, but the entire R3F + shadcn + Clerk + Inngest ecosystem still documents 15 patterns. Pin 15.5 to avoid bleed-edge breakage during a 3-day hackathon. |
| **React** | `19.0.x` | UI runtime | Required by Next 15 App Router. Note: React 19 is what makes R3F v9 work — R3F v8 is React 18 only. |
| **TypeScript** | `5.5.x+` | Type safety | Stripe SDK and ElevenLabs JS SDK both ship modern types. `strict: true` mandatory — payment + voice consent code must be type-safe. |
| **Tailwind CSS** | `4.3.x` | Styling | v4 uses the `@import "tailwindcss"` syntax — no `tailwind.config.ts` needed. shadcn/ui has full v4 support. |
| **shadcn/ui** | latest (CLI-driven, not versioned) | Component library | Constraint-mandated. Use with `--legacy-peer-deps` if on npm + React 19, or just use pnpm. |
| **Three.js** | `0.178.x` (r178) | 3D engine | Pin to r178, not r180+. R3F v9.6.1 ships with peer dep on `three@>=0.156`, and recent r180+ releases shuffled module exports. r178 is the last "boring" release. |
| **@react-three/fiber** | `9.6.1` | React renderer for Three.js | The React 19-compatible line. **Do not install v8 — it will silently break with React 19.** |
| **@react-three/drei** | `10.5.x+` | R3F helpers (controls, loaders, splat abstraction) | Has built-in declarative `<Splat />` abstraction around antimatter15/splat — but for **production .spz with depth sorting**, prefer Spark.js's R3F bindings (below). Drei is still needed for `CameraControls`, `Html`, `Loader`, `Environment`. |
| **@sparkjsdev/spark** | latest | .spz Gaussian splat renderer | The only actively-maintained, format-complete (.ply/.spz/.splat/.ksplat/.sog) splat renderer for Three.js in 2026. World Labs (Marble's vendor) ships it. Uses Web Workers + Rust WASM for loading; WebGL2 rendering; iOS-compatible. |
| **@sparkjsdev/spark-react-r3f** | latest | R3F bindings for Spark | Declarative `<SparkRenderer />` and `<SplatMesh />` JSX components. This is the production-grade path. |
| **Stripe Node SDK** | `22.1.x` (API version `2026-04-22.dahlia`) | Payments + Meters | Constraint-mandated. v22 is the current line. The Meters API replaces the legacy usage records API (gone since `2025-03-31.basil`). |
| **@stripe/stripe-js** | `4.x` | Client-side Checkout redirect | Pair with server `stripe@22`. You only need this if you embed Stripe.js — for hosted Checkout you can redirect to the Session URL and skip it. |
| **@elevenlabs/elevenlabs-js** | `2.47.x` | Voice cloning + SFX + TTS | The current official Node SDK. **Note: the package name is `@elevenlabs/elevenlabs-js`, NOT the older `elevenlabs` (v1.59, deprecated) or `@elevenlabs/client` (browser-only).** |
| **@fal-ai/client** | latest | Hunyuan3D per-object meshes | Replaces the deprecated `@fal-ai/serverless-client`. Use `fal.subscribe()` for the long-poll request pattern image-blaster needs. |
| **World Labs SDK** | World API client (Jan 2026 public) | Marble 1.1 splat generation | World API accepts image input, returns `.ply` (Spark.js converts to `.spz` for delivery). Apply for API key ~24h waitlist. |
| **Vercel** | Fluid Compute enabled | Hosting + CDN | Constraint-mandated. **Fluid Compute is REQUIRED** — without it, Pro is capped at 15s function execution. With Fluid Compute, Pro = 800s (enough for the 5-min pipeline if you absolutely insist on synchronous, but you should still use Inngest). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Inngest** | `3.x` | Background job orchestration | **Required.** Wraps the 5-min image-blaster pipeline as a durable, step-based job. Next.js route POSTs the job, returns a job ID, client polls or subscribes via realtime. Free tier (50k function runs/mo) covers the hackathon. |
| **@vercel/blob** | latest | Image upload + .spz/.glb/.mp3 storage | Best fit for "already on Vercel, simple integration, public CDN delivery, <100GB." Client uploads avoid the 4.5MB serverless request body limit. |
| **Clerk** | `@clerk/nextjs@6.x` | Auth + user sessions | Fastest setup for hackathon. Native App Router + Server Components, passkey support, free tier covers 10k MAU. Alternative: skip auth entirely for V1 and key off Stripe customer email. |
| **Neon** | serverless Postgres | Database (users, scenes, payments, voice clone records) | Branching + scale-to-zero + generous free tier; the de facto Postgres for Vercel + Next.js in 2026. Use the `@neondatabase/serverless` driver with Drizzle's HTTP adapter. |
| **Drizzle ORM** | `0.36.x+` | TypeScript ORM | 90% smaller bundle than Prisma; sub-500ms cold starts vs 1-3s; first-class serverless. Schema-as-code in TypeScript. |
| **Zod** | `3.x` | Runtime validation | Validate Stripe webhook bodies, ElevenLabs voice consent attestation, image upload metadata. Drizzle + Zod integrates cleanly. |
| **Sentry** | `@sentry/nextjs@8.x` | Error tracking | Specifically catches the Next.js gotchas (server actions, hydration). Generation pipeline will fail in interesting ways — Sentry's Inngest integration is supported. |
| **PostHog** | `posthog-js@1.x` + `posthog-node@4.x` | Product analytics + session replay | Lightweight client integration via `instrumentation-client.ts` (Next 15.3+). 100k errors/mo free tier doubles as backup error tracking. Critical for hackathon: session replay shows the demo judge what users do. |
| **react-dropzone** | `14.x` | Image upload UX | Standard drag-drop file input — clean integration with Vercel Blob client upload. |
| **lucide-react** | latest | Icons | shadcn/ui default icon library. |
| **sonner** | `1.x` | Toast notifications | shadcn/ui-recommended toast library. Use for "Voice clone consent confirmed" / "Payment received" feedback. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **pnpm** | Package manager | **Use pnpm, not npm.** React 19 + shadcn/ui peer dep conflicts force `--legacy-peer-deps` on npm. pnpm/yarn/bun handle this cleanly. |
| **Turbopack** | Dev bundler | Enabled by default in Next 15.5 with `--turbopack` flag. 5-10x faster Fast Refresh. |
| **Biome** OR **ESLint + Prettier** | Linting + formatting | Biome (`@biomejs/biome@1.9.x`) is faster and simpler for a hackathon. ESLint if you need shadcn/ui's a11y plugin coverage. |
| **Stripe CLI** | Webhook testing | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` — non-negotiable for testing Meters + Checkout webhooks. |
| **Drizzle Kit** | Schema migrations | `drizzle-kit generate` + `drizzle-kit push` for hackathon-velocity schema changes. |

---

## Installation

```bash
# Scaffold
pnpm create next-app@15.5 living-photos --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd living-photos

# 3D + Splat rendering
pnpm add three@0.178 @react-three/fiber@9.6.1 @react-three/drei@10.5
pnpm add @sparkjsdev/spark @sparkjsdev/spark-react-r3f

# Payments
pnpm add stripe@22 @stripe/stripe-js@4

# ElevenLabs (voice clone + SFX + TTS)
pnpm add @elevenlabs/elevenlabs-js@2.47

# Image-blaster pipeline dependencies
pnpm add @fal-ai/client
# World Labs: install per their docs once API key arrives (no public npm yet — likely a fetch wrapper)

# Background jobs (REQUIRED for 5-min pipeline)
pnpm add inngest

# Storage + DB + ORM
pnpm add @vercel/blob @neondatabase/serverless drizzle-orm
pnpm add -D drizzle-kit

# Auth
pnpm add @clerk/nextjs@6

# Validation + analytics + observability
pnpm add zod posthog-js posthog-node @sentry/nextjs

# UI
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card dialog form input label progress sonner toast
pnpm add lucide-react react-dropzone

# Dev tools
pnpm add -D @biomejs/biome
# OR keep ESLint:
# (already installed by create-next-app)

# Types for Three.js
pnpm add -D @types/three
```

### Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ElevenLabs
ELEVENLABS_API_KEY=...

# FAL (Hunyuan3D)
FAL_KEY=...

# World Labs (Marble 1.1)
WORLD_LABS_API_KEY=...

# Vercel
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Database
DATABASE_URL=postgresql://...neon.tech/...

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Background jobs
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Observability
SENTRY_DSN=...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Critical Integration Patterns

### 1. Image-blaster Integration: DO NOT Run Inline

**WRONG:**
```typescript
// app/api/generate/route.ts — THIS WILL TIME OUT
export async function POST(req: Request) {
  const result = await runImageBlasterPipeline(image); // 4-5 minutes
  return Response.json(result);
}
```

**RIGHT:**
```typescript
// app/api/generate/route.ts — Trigger Inngest job, return immediately
import { inngest } from "@/lib/inngest";
export async function POST(req: Request) {
  const { sceneId } = await db.insert(scenes).values({...}).returning({sceneId: scenes.id});
  await inngest.send({ name: "scene/generate.requested", data: { sceneId } });
  return Response.json({ sceneId });
}

// inngest/functions.ts
export const generateScene = inngest.createFunction(
  { id: "generate-scene", concurrency: 5 },
  { event: "scene/generate.requested" },
  async ({ event, step }) => {
    const splat = await step.run("marble", () => callWorldLabsMarble(event.data));
    const meshes = await step.run("hunyuan", () => callFalHunyuan3D(event.data));
    const sfx = await step.run("elevenlabs-sfx", () => callElevenLabsSFX(event.data));
    return await step.run("compose", () => assembleScene({ splat, meshes, sfx }));
  }
);
```

Fork the image-blaster CLI's TypeScript modules (not the CLI itself) into `src/lib/image-blaster/` and call them as functions from Inngest steps.

### 2. Three.js + Next.js SSR: Always Dynamic Import

**WRONG:**
```typescript
// app/scene/[id]/page.tsx — Hydration error guaranteed
import { Canvas } from "@react-three/fiber";
import { SplatViewer } from "./SplatViewer";
export default function Page() { return <Canvas><SplatViewer /></Canvas>; }
```

**RIGHT:**
```typescript
// app/scene/[id]/page.tsx
import dynamic from "next/dynamic";
const SceneViewer = dynamic(() => import("./SceneViewer"), {
  ssr: false,
  loading: () => <div>Loading scene...</div>,
});
export default function Page() { return <SceneViewer />; }

// app/scene/[id]/SceneViewer.tsx — "use client" + Canvas + Spark.js
"use client";
import { Canvas } from "@react-three/fiber";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark-react-r3f";
import { CameraControls } from "@react-three/drei";
export default function SceneViewer({ splatUrl }: { splatUrl: string }) {
  return (
    <Canvas>
      <SparkRenderer>
        <SplatMesh src={splatUrl} />
        <CameraControls />
      </SparkRenderer>
    </Canvas>
  );
}
```

This is non-negotiable: R3F uses WebGL, WebGL needs `window`, `window` doesn't exist on the server.

### 3. ElevenLabs Voice Clone with Consent

```typescript
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });

// Server-side voice clone (call AFTER consent attestation recorded)
const voice = await client.voices.ivc.create({
  name: `scene-${sceneId}-voice`,
  files: [voiceSampleBlob],
  description: "User-provided sample with attestation",
});

// Generate ambient narration
const audio = await client.textToSpeech.convert(voice.voiceId, {
  text: narrationScript,
  modelId: "eleven_multilingual_v2",
});

// Generate ambient SFX (image-blaster pattern)
const sfx = await client.textToSoundEffects.convert({
  text: "warm interior living room ambience, distant clock ticking",
  durationSeconds: 30,
  loop: true,
  promptInfluence: 0.5,
});
```

### 4. Stripe Checkout + Meters Pattern

```typescript
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

// One-time $19 scene purchase
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [{ price: "price_xxx_scene_19", quantity: 1 }],
  success_url: `${origin}/scene/${sceneId}?success=true`,
  cancel_url: `${origin}/?canceled=true`,
  metadata: { sceneId, userId },
});

// Subscription ($49/yr) with Meter for overage on Family Plan
const subscription = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [
    { price: "price_xxx_family_49yr" }, // base
    { price: "price_xxx_metered_scene_overage" }, // metered, attached to a Meter
  ],
});

// Record meter event on each scene generation
await stripe.billing.meterEvents.create({
  event_name: "scene_generated",
  payload: { stripe_customer_id: customerId, value: "1" },
  identifier: `scene-${sceneId}`, // idempotency key, prevents double-count
});
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Spark.js** for splats | `@mkkellogg/gaussian-splats-3d` | If you already have an existing prototype using it. **Otherwise no — it's unmaintained as of 2025.** |
| **Spark.js** for splats | `antimatter15/splat` (via drei `<Splat />`) | If you only need basic .splat format (no .spz, no LOD, no large worlds). Spark supports everything plus better mobile perf. |
| **Inngest** for jobs | **Trigger.dev** | If you prefer pure async/await TypeScript functions over Inngest's event-driven step model. Trigger.dev's free tier is also generous. Either works for the hackathon — pick what the team knows. |
| **Inngest** for jobs | **Vercel Cron + KV** | NO — this is for periodic jobs, not interactive 5-min user-triggered pipelines. |
| **Clerk** for auth | **Better Auth** | If you require self-hosting / data residency. Hackathon: Clerk wins on setup speed. |
| **Clerk** for auth | **No auth (Stripe customer email)** | V1 demo: legitimately viable. Generate scene → enter email → Stripe Checkout → success page → emailed share URL. Skip Clerk for V1 if shipping speed > UX polish. |
| **Neon** for DB | **Supabase** | If you also want auth + storage + realtime in one platform. Tradeoff: more lock-in, slower cold starts than Neon. |
| **Neon** for DB | **Convex** | If real-time scene generation status was central — but Inngest already solves status with its realtime API. Skip Convex. |
| **Drizzle** ORM | **Prisma** | If you need Prisma Studio for hackathon debugging — but Drizzle Studio (`drizzle-kit studio`) is fine. Drizzle has 5x faster cold starts on Vercel. |
| **Vercel Blob** | **Cloudflare R2 + presigned URLs** | If demo will generate >100GB of splats, or you're outside Vercel ecosystem. For hackathon: Vercel Blob is one less integration to debug. |
| **Vercel Blob** | **UploadThing** | UploadThing has 5-min setup, S3-backed, opinionated. Defensible choice if Vercel Blob hits limits. |
| **shadcn/ui** | **Radix UI + custom** | Shadcn/ui already wraps Radix — only skip if you've banned bundled components. |
| **Vercel hosting** | **Cloudflare Workers / Fly.io** | NO — image-blaster pipeline needs Node runtime, not edge. Vercel + Fluid Compute is the right primitive. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **`elevenlabs` npm package (v1.59)** | Deprecated for over a year. Old API surface, no voice clone v2 endpoints, no streaming SFX. | `@elevenlabs/elevenlabs-js@2.47` |
| **`@fal-ai/serverless-client`** | Deprecated by FAL — pulls in old client patterns that won't work with current Hunyuan3D endpoints. | `@fal-ai/client` |
| **R3F v8 (`@react-three/fiber@8`)** | Pairs with React 18 only. Will throw `Cannot read properties of undefined (reading 'ReactCurrentOwner')` on Next.js 15 / React 19. | `@react-three/fiber@9.6.1` |
| **`mkkellogg/GaussianSplats3D`** | Author explicitly states it's no longer maintained — it was a side project. Missing .spz support, no R3F bindings, no LOD. | `@sparkjsdev/spark` + `@sparkjsdev/spark-react-r3f` |
| **Three.js r180+ on day 1** | Recent r180+ shuffled `NodeMaterial` and friends — Drei and Spark.js peer deps are not all upgraded yet. | `three@0.178` |
| **Stripe legacy usage records API** | Removed since API version `2025-03-31.basil`. Every metered price now requires a backing Meter. | Stripe Billing **Meters API** (`stripe.billing.meterEvents.create`) |
| **Synchronous generation in API routes** | Vercel Hobby = 60s, Pro w/o Fluid Compute = 15s. Image-blaster takes 4-5 min. Guaranteed timeout. | Inngest job + status polling, or Trigger.dev |
| **`tailwind.config.ts` for Tailwind v4** | v4 uses CSS-first config via `@theme` directive in `globals.css`. The JS config file is legacy. | `@import "tailwindcss"` + `@theme` block |
| **Pages Router** | Constraint says App Router; also: R3F docs, Clerk docs, shadcn/ui docs in 2026 default to App Router. | Next.js 15 **App Router** |
| **`npm install` with React 19 + shadcn** | Peer dep conflicts require `--legacy-peer-deps` and you'll forget once and break CI. | `pnpm` |
| **NextAuth v4** | EOL'd; only Auth.js v5 is maintained. Even then: not the recommended choice for hackathon speed. | `@clerk/nextjs@6` |
| **Hedra Realtime Avatar product** | **Sunsetted April 15, 2026.** Don't build on it. | Hedra Character-3 **API** (the longer-form video model) for V3 |
| **Embedding image-blaster CLI directly** | Forking the CLI binary means shipping its own Node process management, env handling, retry logic. | Fork its TypeScript **modules** into `src/lib/image-blaster/`, call as functions from Inngest steps |
| **Three.js OrbitControls (direct)** | Triggers SSR + import errors. | Drei's `<CameraControls />` inside R3F Canvas |

---

## Stack Patterns by Variant

**If hackathon V1 (3-day build, demo-ready):**
- Drop Clerk, key off Stripe customer email + magic share URL
- Drop Drizzle migrations — write schema once with `drizzle-kit push` and never look back
- Vercel Blob (not R2) — one less account to set up
- Inngest (not Trigger.dev) — faster Next.js setup
- Skip Hedra entirely (V3 territory)

**If V2 (multi-photo stitching):**
- Add image stitching preprocessing step before Marble call (Inngest step)
- May need a queue priority system as scenes get heavier — Inngest handles this natively

**If V3 (Hedra talking avatars):**
- Use Hedra Character-3 **long-form API** (not the sunsetted Realtime product)
- Person detection + inpainting preprocessor (likely another FAL model — InstantID/InpaintAnything family) before Marble
- Composite the Hedra MP4 video frames as a textured `<Plane />` billboard inside the R3F scene, positioned where the person was

**If mobile share-link performance is failing:**
- Generate a LowPoly splat tier server-side (Spark.js's quantizer + LOD)
- Detect mobile in viewer, serve the LowPoly `.spz`
- Cap render polycount via Hunyuan3D's `target_face_num` parameter

---

## Version Compatibility Matrix

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@15.5` | `react@19.0`, `react-dom@19.0` | App Router is React 19 only. Pages Router has React 18 fallback (irrelevant for us). |
| `@react-three/fiber@9.6.1` | `react@19.x`, `three@>=0.156` | **v9 = React 19. v8 = React 18.** Hard incompatibility — they'll silently mount but break on render. |
| `@react-three/drei@10.5+` | `@react-three/fiber@9.x`, `react@19` | Drei v10 follows R3F v9's React 19 line. |
| `three@0.178` | R3F 9.6.1, Drei 10.5+, Spark.js | r178 is the last release before r180+ NodeMaterial reshuffles. Safe choice. |
| `@sparkjsdev/spark` | `three@>=0.160` | Pairs cleanly with r178. WebGL2 required (every modern browser, including iOS 15+). |
| `stripe@22` | Node 18+, Node 22+ recommended | Node 16 support dropped March 2026. Vercel functions run Node 20 by default. |
| `@elevenlabs/elevenlabs-js@2.47` | Node 18+ | Modern ESM, native fetch. Don't need polyfills. |
| `@clerk/nextjs@6` | `next@15`, `react@19` | v6 line tracks Next 15 / React 19. |
| `drizzle-orm` + `@neondatabase/serverless` | All Node + Edge runtimes | Drizzle has explicit Neon HTTP driver support. |
| `tailwindcss@4.3` | Vite, Next, PostCSS via `@tailwindcss/postcss` | Next 15 + Tailwind v4 needs `@tailwindcss/postcss` plugin in PostCSS config. |
| `inngest@3` | Next 15 App Router | Uses route handler `app/api/inngest/route.ts`. |

### Known Compatibility Footguns

- **Tailwind v4 + shadcn/ui**: shadcn's `init` command will detect v4 and emit a CSS-first theme. If you have an old `tailwind.config.ts`, delete it.
- **R3F + Next.js 15 hydration**: Wrap the Canvas in `dynamic(() => import('./Scene'), { ssr: false })`. Without this you'll get `TypeError: Cannot read properties of undefined (reading 'ReactCurrentOwner')` — a confusing error that's actually a React 19 + SSR + WebGL issue.
- **Three.js + Vercel**: Three.js is a 600kb ES module — make sure your `next.config.js` doesn't transpile it through Webpack 4 paths. Turbopack handles it correctly out of the box.
- **Stripe webhook + Next.js App Router**: Use `req.text()` not `req.json()` for webhook signature verification. The raw body is required.
- **Inngest + Vercel Fluid Compute**: Inngest's step retry timeouts must be set below your Vercel function max duration. Set `inngest.createFunction({ timeouts: { start: "60s", finish: "10m" } })` and ensure Vercel Pro Fluid Compute is enabled for 800s max.
- **`@vercel/blob` client upload**: Requires `app/api/upload/route.ts` to issue presigned URLs. Don't try to POST files through your own API route — you'll hit the 4.5MB body limit.

---

## Confidence Notes by Recommendation

| Recommendation | Confidence | Verification |
|----------------|------------|--------------|
| Next.js 15.5 + React 19 + App Router | HIGH | Constraint-mandated; verified Next.js blog + release notes |
| Three.js r178 + R3F v9.6.1 + Drei 10.5 | HIGH | npm verified, R3F compatibility matrix verified |
| Spark.js for splats | HIGH | Active development verified, R3F bindings repo exists, World Labs uses it |
| ElevenLabs `@elevenlabs/elevenlabs-js@2.47` | HIGH | npm verified, 15h since last publish |
| Stripe Node 22 + API version `2026-04-22.dahlia` | HIGH | npm + Stripe changelog verified |
| FAL `@fal-ai/client` (not `serverless-client`) | HIGH | FAL docs explicitly state deprecation |
| Inngest for the 5-min pipeline | HIGH | Vercel function limits verified; Inngest patterns verified |
| Clerk + Neon + Drizzle | MEDIUM-HIGH | Best fit for stated constraints; alternative paths viable |
| Vercel Blob over R2 | MEDIUM | Decision depends on demo scale; Vercel Blob is faster setup, R2 is cheaper at scale |
| Tailwind v4.3 + shadcn/ui | HIGH | shadcn/ui official Tailwind v4 docs |
| World Labs Marble 1.1 API client | MEDIUM | Public API exists; npm package availability not directly verified — may require fetch wrapper |
| Hedra Character-3 API (V3) | MEDIUM | Private beta noted; verify access timeline before committing V3 plan |

---

## Sources

### Authoritative (Official Docs / npm)
- [Next.js 15.5 release notes](https://nextjs.org/blog/next-15-5)
- [@react-three/fiber npm](https://www.npmjs.com/package/@react-three/fiber) — v9.6.1, last published recently
- [Spark.js — GitHub](https://github.com/sparkjsdev/spark) and [spark-react-r3f](https://github.com/sparkjsdev/spark-react-r3f)
- [@elevenlabs/elevenlabs-js npm](https://www.npmjs.com/package/@elevenlabs/elevenlabs-js) — v2.47
- [stripe-node CHANGELOG](https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md) — v22.1.1, API `2026-04-22.dahlia`
- [Stripe Billing Meters API](https://docs.stripe.com/api/billing/meter)
- [@fal-ai/client docs (Hunyuan3D v3)](https://fal.ai/models/fal-ai/hunyuan3d-v3/image-to-3d/api)
- [World Labs Marble docs](https://docs.worldlabs.ai/marble/models)
- [Vercel Function Limits + Fluid Compute](https://vercel.com/docs/functions/limitations)
- [Vercel Blob docs](https://vercel.com/docs/vercel-blob)
- [Tailwind CSS v4.3](https://tailwindcss.com/blog/tailwindcss-v4-3)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4)
- [Inngest Next.js docs](https://www.inngest.com/docs/guides/background-jobs)
- [Clerk Next.js App Router docs](https://clerk.com/docs/references/nextjs/auth)
- [Drizzle ORM + Neon tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-nextjs-neon)
- [ElevenLabs Sound Effects API](https://elevenlabs.io/docs/overview/capabilities/sound-effects)
- [ElevenLabs Instant Voice Cloning quickstart](https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/instant-voice-cloning)
- [Hedra Character-3 overview](https://www.hedra.com/docs/pages/realtime-avatar/about) (Realtime sunset noted)
- [image-blaster (project being forked)](https://github.com/neilsonnn/image-blaster)

### Comparison + Pattern References
- [LogRocket — Best auth library for Next.js 2026](https://blog.logrocket.com/best-auth-library-nextjs-2026/) — MEDIUM (industry survey)
- [Bytebase — Drizzle vs Prisma 2026](https://www.bytebase.com/blog/drizzle-vs-prisma/) — MEDIUM
- [BuildPilot — How to Handle File Uploads in Next.js 2026](https://trybuildpilot.com/499-how-to-handle-file-uploads-nextjs-2026) — MEDIUM
- [BuildPilot — Trigger.dev vs Inngest vs Temporal 2026](https://trybuildpilot.com/610-trigger-dev-vs-inngest-vs-temporal-2026) — MEDIUM
- [3DGS Formats Compared 2026 (.spz advantages)](https://www.polyvia3d.com/formats/gaussian-splatting-formats) — MEDIUM

---

*Stack research for: Living Photos (consumer AI image-to-3D-scene + voice + payment)*
*Researched: 2026-05-15*
*Author confidence: HIGH on framework stack; HIGH on R3F/Spark.js choices; HIGH on payment/voice SDKs; HIGH on background job architecture (the most important architectural decision).*
