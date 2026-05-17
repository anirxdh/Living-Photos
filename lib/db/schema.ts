/**
 * Drizzle schema — Living Photos
 *
 * Tables:
 *  - users                       — minimal user record (Clerk-linked when auth lands)
 *  - scenes                      — uploaded photo + generation lifecycle + paid flag
 *  - voice_clones                — ElevenLabs voice IDs, gated by consent artifacts
 *  - payments                    — Stripe checkout sessions, idempotent via stripe_event_id
 *  - processed_webhook_events    — UNIQUE event_id constraint = webhook idempotency floor
 */
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const sceneStatusEnum = pgEnum("scene_status", [
  "pending",
  "uploading",
  "queued",
  "generating",
  "ready",
  "failed",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  // Persisted across purchases so the SECOND checkout reuses the same Stripe
  // Customer, surfacing saved payment methods ("Pay with •••• 4242") instead
  // of forcing the user to re-enter their card every time.
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scenes = pgTable(
  "scenes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    userId: text("user_id"),
    anonymousEmail: text("anonymous_email"),
    title: text("title").notNull().default("Untitled memory"),
    description: text("description"),
    sourcePhotoUrl: text("source_photo_url").notNull(),
    status: sceneStatusEnum("status").notNull().default("pending"),
    spzUrl: text("spz_url"),
    spzUrlLowPoly: text("spz_url_lowpoly"),
    meshes: jsonb("meshes").$type<Array<{ url: string; label: string }>>().default([]),
    ambientSfxUrl: text("ambient_sfx_url"),
    narrationUrl: text("narration_url"),
    voiceCloneId: text("voice_clone_id"),
    paid: boolean("paid").notNull().default(false),
    generationCostCents: integer("generation_cost_cents").notNull().default(0),
    pricePaidCents: integer("price_paid_cents"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readyAt: timestamp("ready_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => ({
    slugIdx: uniqueIndex("scenes_slug_idx").on(t.slug),
  }),
);

export const voiceClones = pgTable("voice_clones", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  sceneId: text("scene_id").references(() => scenes.id, { onDelete: "set null" }),
  /** ElevenLabs voice_id. NULL until consent is verified AND IVC succeeds. */
  elevenVoiceId: text("eleven_voice_id"),
  name: text("name").notNull().default("Voice"),
  consentArtifactUrl: text("consent_artifact_url").notNull(),
  consentTranscript: text("consent_transcript").notNull(),
  consentNonce: text("consent_nonce").notNull(),
  consentVerifiedAt: timestamp("consent_verified_at", { withTimezone: true }),
  /** True if voice belongs to the uploader (voiceprint-match passed). */
  isSelfVoice: boolean("is_self_voice").notNull().default(false),
  /** Hard cap (3) enforced at app level; counter persisted for observability. */
  regenerationCount: integer("regeneration_count").notNull().default(0),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  sceneId: text("scene_id")
    .notNull()
    .references(() => scenes.id, { onDelete: "cascade" }),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  email: text("email"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const processedWebhookEvents = pgTable(
  "processed_webhook_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload"),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerEventIdx: uniqueIndex("processed_events_unique_idx").on(t.provider, t.eventId),
  }),
);

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  sceneId: text("scene_id")
    .notNull()
    .references(() => scenes.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  reporterEmail: text("reporter_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Scene = typeof scenes.$inferSelect;
export type NewScene = typeof scenes.$inferInsert;
export type VoiceClone = typeof voiceClones.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type ProcessedWebhookEvent = typeof processedWebhookEvents.$inferSelect;
export type User = typeof users.$inferSelect;
