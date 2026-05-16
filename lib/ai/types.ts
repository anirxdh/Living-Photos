/**
 * Adapter contracts.
 *
 * Every upstream paid service (World Labs Marble, FAL Hunyuan3D, ElevenLabs
 * IVC + SFX, Stripe) is wrapped behind one of these interfaces. A MockAdapter
 * and a RealAdapter implement each interface; the factory in `factory.ts`
 * selects which to bind based on `env.MOCK_MODE`.
 *
 * RULES for adapter implementations:
 *  1. Pure functions of (input) → Promise<Output>. No global mutation.
 *  2. Mock outputs are deterministic — same input always returns same id/URL.
 *  3. Real outputs must satisfy the same shape; never leak vendor-specific
 *     fields into the return type.
 *  4. Adapter contract tests in tests/contract/*.test.ts run against BOTH
 *     implementations. If a contract test passes Mock and Real, the swap is
 *     safe.
 */

// --- World Labs Marble (image → Gaussian splat environment) ----------------
export interface MarbleSubmitInput {
  imageUrl: string;
  /** Caller-supplied id for idempotency + deterministic mock output. */
  sceneId: string;
  /** Optional webhook URL for resumption. */
  webhookUrl?: string;
}
export interface MarbleSubmitOutput {
  jobId: string;
  /** ISO timestamp when result is expected to be ready (estimate). */
  estimatedReadyAt: string;
}
export interface MarbleResult {
  jobId: string;
  status: "pending" | "succeeded" | "failed";
  spzUrl?: string;
  spzUrlLowPoly?: string;
  costCents: number;
  error?: string;
}
export interface MarbleAdapter {
  submit(input: MarbleSubmitInput): Promise<MarbleSubmitOutput>;
  poll(jobId: string): Promise<MarbleResult>;
}

// --- FAL Hunyuan3D (image crop → 3D mesh) ----------------------------------
export interface MeshSubmitInput {
  imageUrl: string;
  /** Optional bounding-box crop {x,y,w,h} normalized 0-1. */
  bbox?: { x: number; y: number; w: number; h: number };
  /** Caller-supplied id for idempotency + deterministic mock output. */
  objectId: string;
  facesTarget?: number;
  webhookUrl?: string;
}
export interface MeshSubmitOutput {
  jobId: string;
}
export interface MeshResult {
  jobId: string;
  status: "pending" | "succeeded" | "failed";
  glbUrl?: string;
  costCents: number;
  error?: string;
}
export interface MeshAdapter {
  submit(input: MeshSubmitInput): Promise<MeshSubmitOutput>;
  poll(jobId: string): Promise<MeshResult>;
}

// --- ElevenLabs SFX (prompt → mp3) -----------------------------------------
export interface SfxInput {
  prompt: string;
  /** Loop seamlessly (ambient). Default true. */
  loop?: boolean;
  /** Duration in seconds; clamped to [1, 22]. */
  durationSeconds?: number;
  /** Deterministic key — same key returns same URL in mock mode. */
  cacheKey?: string;
}
export interface SfxOutput {
  url: string;
  durationSeconds: number;
  costCents: number;
}
export interface SfxAdapter {
  generate(input: SfxInput): Promise<SfxOutput>;
}

// --- ElevenLabs IVC (audio sample → voice_id) -----------------------------
export interface VoiceCloneInput {
  /** URL to an audio sample (15-120s recommended). */
  sampleUrl: string;
  name: string;
  description?: string;
}
export interface VoiceCloneOutput {
  voiceId: string;
  costCents: number;
}
export interface NarrationInput {
  voiceId: string;
  text: string;
  cacheKey?: string;
}
export interface NarrationOutput {
  url: string;
  durationSeconds: number;
  costCents: number;
}
export interface VoiceAdapter {
  cloneVoice(input: VoiceCloneInput): Promise<VoiceCloneOutput>;
  generateNarration(input: NarrationInput): Promise<NarrationOutput>;
  deleteVoice(voiceId: string): Promise<void>;
}

// --- Stripe (checkout sessions) --------------------------------------------
export interface CheckoutInput {
  sceneId: string;
  userId?: string;
  amountCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  productName: string;
}
export interface CheckoutOutput {
  sessionId: string;
  url: string;
}
export interface StripeWebhookVerifyInput {
  rawBody: string;
  signature: string;
}
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      metadata?: Record<string, string>;
      amount_total?: number;
      currency?: string;
      customer_email?: string;
      payment_intent?: string;
    };
  };
}
export interface StripeAdapter {
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutOutput>;
  verifyAndParseWebhook(input: StripeWebhookVerifyInput): StripeWebhookEvent;
}

// --- Storage (Vercel Blob, but mockable) -----------------------------------
export interface BlobUploadInput {
  /** Path/key for the blob. */
  pathname: string;
  /** ArrayBuffer / Buffer / string contents. */
  body: ArrayBuffer | Buffer | string;
  contentType?: string;
}
export interface BlobUploadOutput {
  url: string;
}
export interface BlobAdapter {
  put(input: BlobUploadInput): Promise<BlobUploadOutput>;
  /** Generate a signed URL for direct client uploads. */
  createSignedUploadUrl(input: { pathname: string; contentType: string }): Promise<{
    url: string;
    publicUrl: string;
  }>;
  delete(url: string): Promise<void>;
}
