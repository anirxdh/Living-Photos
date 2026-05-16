/**
 * Adapter factory — the only place that decides Mock vs Real.
 *
 * Calling code imports `adapters()` and gets a typed bag of all adapters.
 * Test code can override via `setAdapters(...)` for fine-grained control.
 */
import { env } from "@/lib/env";
import { MockBlobAdapter, RealBlobAdapter } from "./blob";
import { MockMeshAdapter, RealMeshAdapter } from "./fal";
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
}

let cached: Adapters | null = null;
let overridden: Partial<Adapters> | null = null;

function build(): Adapters {
  if (env.MOCK_MODE) {
    return {
      marble: new MockMarbleAdapter(),
      mesh: new MockMeshAdapter(),
      sfx: new MockSfxAdapter(),
      voice: new MockVoiceAdapter(),
      stripe: new MockStripeAdapter(),
      blob: new MockBlobAdapter(),
    };
  }
  return {
    marble: new RealMarbleAdapter(env.WORLD_LABS_API_KEY),
    mesh: new RealMeshAdapter(env.FAL_KEY),
    sfx: new RealSfxAdapter(env.ELEVENLABS_API_KEY),
    voice: new RealVoiceAdapter(env.ELEVENLABS_API_KEY),
    stripe: new RealStripeAdapter(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET),
    blob: new RealBlobAdapter(env.BLOB_READ_WRITE_TOKEN),
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
