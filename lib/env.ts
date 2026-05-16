/**
 * Validated, typed env. Single source of truth for environment configuration.
 *
 * Rules:
 *  - In MOCK_MODE we tolerate missing paid-API keys.
 *  - We never throw at import time in production — log and continue (Sentry catches).
 *  - Tests force MOCK_MODE=true via vitest.config env.
 */
import { z } from "zod";

const schema = z
  .object({
    MOCK_MODE: z
      .string()
      .optional()
      .transform((v) => v?.toLowerCase() === "true"),

    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

    DATABASE_URL: z.string().min(1).default("postgres://placeholder@localhost:5432/livingphotos"),
    BLOB_READ_WRITE_TOKEN: z.string().optional().default(""),

    INNGEST_EVENT_KEY: z.string().optional().default(""),
    INNGEST_SIGNING_KEY: z.string().optional().default(""),

    WORLD_LABS_API_KEY: z.string().optional().default(""),
    FAL_KEY: z.string().optional().default(""),
    ELEVENLABS_API_KEY: z.string().optional().default(""),
    HEDRA_API_KEY: z.string().optional().default(""),

    STRIPE_SECRET_KEY: z.string().default("sk_test_placeholder"),
    STRIPE_WEBHOOK_SECRET: z.string().default("whsec_placeholder"),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().default("pk_test_placeholder"),

    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional().default(""),
    CLERK_SECRET_KEY: z.string().optional().default(""),

    SENTRY_DSN: z.string().optional().default(""),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().default(""),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().default("https://us.i.posthog.com"),

    RESEND_API_KEY: z.string().optional().default(""),
    RESEND_FROM_EMAIL: z.string().default("Living Photos <hello@livingphotos.app>"),
  })
  .transform((raw) => ({
    ...raw,
    MOCK_MODE: raw.MOCK_MODE ?? raw.NODE_ENV === "test",
  }));

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // In dev/test we still want to surface issues but never crash imports.
    console.error("[env] validation failed:", parsed.error.flatten().fieldErrors);
    // biome-ignore lint/suspicious/noExplicitAny: fallback when env is malformed
    return schema.parse({} as any);
  }
  return parsed.data;
}

export const env: Env = loadEnv();

/** Server-only sentinel — never import this in client code. */
export const isMock = env.MOCK_MODE;
