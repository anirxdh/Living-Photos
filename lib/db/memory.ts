/**
 * In-memory DB for MOCK_MODE. Mirrors the Drizzle schema surface area we
 * actually use (CRUD on scenes / voice clones / payments / processed events).
 * Reset between Vitest runs by importing `resetMemoryStore()`.
 */
import type { NewScene, Payment, ProcessedWebhookEvent, Scene, VoiceClone } from "./schema";

interface Store {
  scenes: Map<string, Scene>;
  voiceClones: Map<string, VoiceClone>;
  payments: Map<string, Payment>;
  processed: Map<string, ProcessedWebhookEvent>; // key = `${provider}:${event_id}`
}

const store: Store = {
  scenes: new Map(),
  voiceClones: new Map(),
  payments: new Map(),
  processed: new Map(),
};

export function resetMemoryStore() {
  store.scenes.clear();
  store.voiceClones.clear();
  store.payments.clear();
  store.processed.clear();
}

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
