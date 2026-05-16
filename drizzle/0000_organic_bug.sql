CREATE TYPE "public"."scene_status" AS ENUM('pending', 'uploading', 'queued', 'generating', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"scene_id" text NOT NULL,
	"stripe_checkout_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "processed_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"scene_id" text NOT NULL,
	"reason" text NOT NULL,
	"reporter_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenes" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"user_id" text,
	"anonymous_email" text,
	"title" text DEFAULT 'Untitled memory' NOT NULL,
	"description" text,
	"source_photo_url" text NOT NULL,
	"status" "scene_status" DEFAULT 'pending' NOT NULL,
	"spz_url" text,
	"spz_url_lowpoly" text,
	"meshes" jsonb DEFAULT '[]'::jsonb,
	"ambient_sfx_url" text,
	"narration_url" text,
	"voice_clone_id" text,
	"paid" boolean DEFAULT false NOT NULL,
	"generation_cost_cents" integer DEFAULT 0 NOT NULL,
	"price_paid_cents" integer,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ready_at" timestamp with time zone,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_clones" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"scene_id" text,
	"eleven_voice_id" text,
	"name" text DEFAULT 'Voice' NOT NULL,
	"consent_artifact_url" text NOT NULL,
	"consent_transcript" text NOT NULL,
	"consent_nonce" text NOT NULL,
	"consent_verified_at" timestamp with time zone,
	"is_self_voice" boolean DEFAULT false NOT NULL,
	"regeneration_count" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_clones" ADD CONSTRAINT "voice_clones_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "processed_events_unique_idx" ON "processed_webhook_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scenes_slug_idx" ON "scenes" USING btree ("slug");