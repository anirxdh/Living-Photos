/**
 * In-memory DB for MOCK_MODE. Mirrors the Drizzle schema surface area we
 * actually use (CRUD on scenes / voice clones / payments / processed events).
 * Reset between Vitest runs by importing `resetMemoryStore()`.
 */
import { LIBRARY_VOICES } from "@/lib/voice/library";
import type { NewScene, Payment, ProcessedWebhookEvent, Scene, User, VoiceClone } from "./schema";

interface Report {
  id: string;
  sceneId: string;
  reason: string;
  reporterEmail: string | null;
  createdAt: Date;
}

interface Store {
  scenes: Map<string, Scene>;
  voiceClones: Map<string, VoiceClone>;
  payments: Map<string, Payment>;
  processed: Map<string, ProcessedWebhookEvent>; // key = `${provider}:${event_id}`
  reports: Map<string, Report>;
  users: Map<string, User>; // key = email (normalized lowercase)
  /** Cheap per-IP rate-limit window for the abuse-report endpoint. */
  reportRate: Map<string, number[]>;
}

/**
 * Cross-bundle singleton. Next.js App Router compiles RSC and Node-runtime
 * route handlers into separate module graphs — without this, `memScenes`
 * gets two different instances and a POST to /api/scenes is invisible to
 * a server component reading from /dashboard. Pinning to globalThis keeps
 * one shared store per Node process.
 */
const _globals = globalThis as unknown as { __livingPhotosStore?: Store };
if (!_globals.__livingPhotosStore) {
  _globals.__livingPhotosStore = {
    scenes: new Map(),
    voiceClones: new Map(),
    payments: new Map(),
    processed: new Map(),
    reports: new Map(),
    users: new Map(),
    reportRate: new Map(),
  };
  // Seed the public ElevenLabs library voices as pre-consented clones so
  // users picking from the "Quick start" dropdown can narrate scenes without
  // recording themselves. Marked consentVerifiedAt so /api/scenes consent
  // gate accepts them just like user-cloned voices. The consent-artifact
  // placeholders document that the consent for a public library voice comes
  // from ElevenLabs's own voice-library terms, not a user attestation.
  const seededAt = new Date(0); // sentinel — distinguishes library from user clones
  for (const v of LIBRARY_VOICES) {
    _globals.__livingPhotosStore.voiceClones.set(v.id, {
      id: v.id,
      userId: null,
      sceneId: null,
      elevenVoiceId: v.elevenVoiceId,
      name: v.name,
      consentArtifactUrl: "library://elevenlabs/voice-library-terms",
      consentTranscript: `Public ElevenLabs library voice: ${v.name}. Consent governed by ElevenLabs Voice Library terms.`,
      consentNonce: "LIBRARY",
      consentVerifiedAt: seededAt,
      isSelfVoice: false,
      regenerationCount: 0,
      revokedAt: null,
      createdAt: seededAt,
    });
  }
}
const store: Store = _globals.__livingPhotosStore;

export function resetMemoryStore() {
  store.scenes.clear();
  store.voiceClones.clear();
  store.payments.clear();
  store.processed.clear();
  store.reports.clear();
  store.users.clear();
  store.reportRate.clear();
}

// --- Reports ----------------------------------------------------------------
export const memReports = {
  insert(r: Report) {
    store.reports.set(r.id, r);
    return r;
  },
  forScene(sceneId: string): Report[] {
    return Array.from(store.reports.values()).filter((r) => r.sceneId === sceneId);
  },
  /** Rolling 1-hour bucket per IP. Returns true if the IP is over `limit`. */
  isRateLimited(ip: string, limit = 10): boolean {
    const now = Date.now();
    const windowMs = 60 * 60_000;
    const prev = (store.reportRate.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (prev.length >= limit) {
      store.reportRate.set(ip, prev);
      return true;
    }
    prev.push(now);
    store.reportRate.set(ip, prev);
    return false;
  },
};

// --- Scenes -----------------------------------------------------------------
export const memScenes = {
  insert(scene: NewScene): Scene {
    const full: Scene = {
      id: scene.id!,
      slug: scene.slug!,
      userId: scene.userId ?? null,
      anonymousEmail: scene.anonymousEmail ?? null,
      title: scene.title ?? "Untitled memory",
      description: scene.description ?? null,
      sourcePhotoUrl: scene.sourcePhotoUrl!,
      status: scene.status ?? "pending",
      spzUrl: scene.spzUrl ?? null,
      spzUrlLowPoly: scene.spzUrlLowPoly ?? null,
      meshes: scene.meshes ?? [],
      ambientSfxUrl: scene.ambientSfxUrl ?? null,
      narrationUrl: scene.narrationUrl ?? null,
      voiceCloneId: scene.voiceCloneId ?? null,
      paid: scene.paid ?? false,
      generationCostCents: scene.generationCostCents ?? 0,
      pricePaidCents: scene.pricePaidCents ?? null,
      error: scene.error ?? null,
      createdAt: scene.createdAt ?? new Date(),
      readyAt: scene.readyAt ?? null,
      paidAt: scene.paidAt ?? null,
    };
    store.scenes.set(full.id, full);
    return full;
  },
  get(id: string) {
    return store.scenes.get(id) ?? null;
  },
  getBySlug(slug: string) {
    for (const s of store.scenes.values()) if (s.slug === slug) return s;
    return null;
  },
  update(id: string, patch: Partial<Scene>): Scene | null {
    const existing = store.scenes.get(id);
    if (!existing) return null;
    const next = { ...existing, ...patch } as Scene;
    store.scenes.set(id, next);
    return next;
  },
  list(): Scene[] {
    return Array.from(store.scenes.values());
  },
};

// --- Voice clones -----------------------------------------------------------
export const memVoiceClones = {
  insert(v: VoiceClone) {
    store.voiceClones.set(v.id, v);
    return v;
  },
  get(id: string) {
    return store.voiceClones.get(id) ?? null;
  },
  update(id: string, patch: Partial<VoiceClone>) {
    const existing = store.voiceClones.get(id);
    if (!existing) return null;
    const next = { ...existing, ...patch };
    store.voiceClones.set(id, next);
    return next;
  },
  list() {
    return Array.from(store.voiceClones.values());
  },
  /** Look up by upstream ElevenLabs voice ID. Used by /api/scenes to validate
   *  that a user-supplied voiceCloneId corresponds to a consented clone before
   *  letting the pipeline narrate with it. */
  getByElevenVoiceId(elevenId: string): VoiceClone | null {
    for (const v of store.voiceClones.values()) {
      if (v.elevenVoiceId === elevenId) return v;
    }
    return null;
  },
};

// --- Payments ---------------------------------------------------------------
export const memPayments = {
  insert(p: Payment) {
    store.payments.set(p.id, p);
    return p;
  },
  list() {
    return Array.from(store.payments.values());
  },
};

// --- Idempotency ------------------------------------------------------------
export const memProcessed = {
  /** Returns true if this is the FIRST time seeing the event. */
  markProcessed(p: ProcessedWebhookEvent): boolean {
    const key = `${p.provider}:${p.eventId}`;
    if (store.processed.has(key)) return false;
    store.processed.set(key, p);
    return true;
  },
  has(provider: string, eventId: string) {
    return store.processed.has(`${provider}:${eventId}`);
  },
  list() {
    return Array.from(store.processed.values());
  },
};
