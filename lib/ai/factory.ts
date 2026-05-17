/**
 * Adapter factory — the only place that decides Mock vs Real.
 *
 * Calling code imports `adapters()` and gets a typed bag of all adapters.
 * Test code can override via `setAdapters(...)` for fine-grained control.
 */
import { env } from "@/lib/env";
import { MockBlobAdapter, RealBlobAdapter } from "./blob";
import { MockMeshAdapter, RealMeshAdapter } from "./fal";
import { type AvatarAdapter, MockAvatarAdapter, RealAvatarAdapter } from "./hedra";
import { MockMarbleAdapter, RealMarbleAdapter } from "./marble";
import { MockSfxAdapter, RealSfxAdapter } from "./sfx";
import { MockStripeAdapter, RealStripeAdapter } from "./stripe";
import type {
  BlobAdapter,
  MarbleAdapter,
  MeshAdapter,
  SfxAdapter,
  StripeAdapter,
  VoiceAdapter,
} from "./types";
import { MockVoiceAdapter, RealVoiceAdapter } from "./voice";

export interface Adapters {
  marble: MarbleAdapter;
  mesh: MeshAdapter;
  sfx: SfxAdapter;
  voice: VoiceAdapter;
  stripe: StripeAdapter;
  blob: BlobAdapter;
  /** V3 — talking-avatar overlay. Stubbed adapter today, real Hedra later. */
  avatar: AvatarAdapter;
}

let cached: Adapters | null = null;
let overridden: Partial<Adapters> | null = null;

function build(): Adapters {
  if (env.MOCK_MODE) {
    // P0 hardening: refuse mock adapters in production builds. MOCK_MODE on a
    // public deployment turns the Stripe webhook signature check into a
    // hardcoded-secret HMAC (the secret is in this repo) and exposes the
    // /api/stripe/mock-fulfill bypass to anyone. One env-var typo on Vercel
    // (e.g. forgetting to set MOCK_MODE=false in prod) should NOT silently
    // open the paywall.
    if (env.NODE_ENV === "production") {
      throw new Error(
        "MOCK_MODE=true is not permitted when NODE_ENV=production. " +
          "Set MOCK_MODE=false and provide real API keys before deploying.",
      );
    }
    // STRIPE_FORCE_REAL lets the developer test real Stripe Checkout (with
    // test-mode keys) while keeping the expensive World Labs / FAL / ElevenLabs
    // calls mocked. Production safety: NODE_ENV check above already prevents
    // MOCK_MODE in prod, so this only ever runs in dev/test.
    const stripeAdapter = env.STRIPE_FORCE_REAL
      ? new RealStripeAdapter(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET)
      : new MockStripeAdapter();
    return {
      marble: new MockMarbleAdapter(),
      mesh: new MockMeshAdapter(),
      sfx: new MockSfxAdapter(),
      voice: new MockVoiceAdapter(),
      stripe: stripeAdapter,
      blob: new MockBlobAdapter(),
      avatar: new MockAvatarAdapter(),
    };
  }
  return {
    marble: new RealMarbleAdapter(env.WORLD_LABS_API_KEY),
    mesh: new RealMeshAdapter(env.FAL_KEY),
    sfx: new RealSfxAdapter(env.ELEVENLABS_API_KEY),
    voice: new RealVoiceAdapter(env.ELEVENLABS_API_KEY),
    stripe: new RealStripeAdapter(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET),
    blob: new RealBlobAdapter(env.BLOB_READ_WRITE_TOKEN),
    avatar: new RealAvatarAdapter(env.HEDRA_API_KEY),
  };
}

/** Get the live adapter bag. */
export function adapters(): Adapters {
  if (overridden) {
    if (!cached) cached = build();
    return { ...cached, ...overridden };
  }
  if (!cached) cached = build();
  return cached;
}

/** Test-only — replace one or more adapters. Call `resetAdapters()` after. */
export function setAdapters(overrides: Partial<Adapters>) {
  overridden = { ...(overridden ?? {}), ...overrides };
}

/** Reset memoized adapters (use in test teardown). */
export function resetAdapters() {
  cached = null;
  overridden = null;
}

/** Discriminator for log + telemetry. */
export const adapterMode: "mock" | "real" = env.MOCK_MODE ? "mock" : "real";
