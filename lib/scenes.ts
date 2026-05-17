/**
 * Scene service — pure functions for the scene lifecycle.
 *
 * Reads/writes go through the in-memory store in MOCK_MODE; in real mode
 * they'd hit Drizzle. Either way the surface area is identical.
 */
import { customAlphabet } from "nanoid";
import { memScenes } from "@/lib/db/memory";
import type { Scene } from "@/lib/db/schema";
import { newId } from "@/lib/utils";

const slugAlphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no easily-confused chars
// 12 chars × log2(32) ≈ 60 bits of entropy — birthday-resistant + non-enumerable.
const makeSlug = customAlphabet(slugAlphabet, 12);

export interface CreateSceneInput {
  sourcePhotoUrl: string;
  title?: string;
  description?: string;
  userId?: string;
  anonymousEmail?: string;
  /** Optional ElevenLabs voice ID — pipeline will narrate the scene's description
   *  in this voice. Created via the /voice flow + handed over to /create. */
  voiceCloneId?: string;
}

export function createScene(input: CreateSceneInput): Scene {
  // Same row shape in both modes. Drizzle persistence lands in the real swap
  // (lib/db/index.ts) — until then, both paths write to the in-memory store.
  return memScenes.insert({
    id: newId("scn"),
    slug: makeSlug(),
    sourcePhotoUrl: input.sourcePhotoUrl,
    title: input.title ?? "Untitled memory",
    description: input.description ?? null,
    userId: input.userId ?? null,
    anonymousEmail: input.anonymousEmail ?? null,
    voiceCloneId: input.voiceCloneId ?? null,
    status: "pending",
    paid: false,
  });
}

export function getScene(id: string): Scene | null {
  return memScenes.get(id);
}

export function getSceneBySlug(slug: string): Scene | null {
  return memScenes.getBySlug(slug);
}

export function listScenesForOwner(opts: { userId?: string; email?: string }): Scene[] {
  // Prefer userId when both are present (auth wins over query-string email).
  const ownerCheck = opts.userId
    ? (s: Scene) => s.userId === opts.userId
    : opts.email
      ? (s: Scene) => s.anonymousEmail === opts.email
      : () => false;
  return memScenes
    .list()
    .filter(ownerCheck)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Public-safe shape of a scene — strips fields a stranger shouldn't see.
 * The viewer-side render uses these fields only after `paid` flips to true.
 */
export function publicScene(s: Scene) {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    status: s.status,
    paid: s.paid,
    createdAt: s.createdAt,
    readyAt: s.readyAt,
    // Owner-only / paid-only fields stripped so slug enumeration can't grab
    // assets or PII for free.
    sourcePhotoUrl: s.paid ? s.sourcePhotoUrl : null,
    spzUrl: s.paid ? s.spzUrl : null,
    spzUrlLowPoly: s.paid ? s.spzUrlLowPoly : null,
    meshes: s.paid ? (s.meshes ?? []) : [],
    ambientSfxUrl: s.paid ? s.ambientSfxUrl : null,
    narrationUrl: s.paid ? s.narrationUrl : null,
  };
}

export function listAllScenes(): Scene[] {
  return memScenes.list().sort((a, b) => {
    const dt = b.createdAt.getTime() - a.createdAt.getTime();
    if (dt !== 0) return dt;
    // Stable secondary sort by id so two creates in the same ms still order
    // by insertion (newer id sorts higher because we always append).
    return b.id.localeCompare(a.id);
  });
}

export function markScenePaid(id: string, priceCents: number): Scene | null {
  return memScenes.update(id, {
    paid: true,
    pricePaidCents: priceCents,
    paidAt: new Date(),
  });
}
