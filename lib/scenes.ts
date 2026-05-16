/**
 * Scene service — pure functions for the scene lifecycle.
 *
 * Reads/writes go through the in-memory store in MOCK_MODE; in real mode
 * they'd hit Drizzle. Either way the surface area is identical.
 */
import { customAlphabet } from "nanoid";
import { memScenes } from "@/lib/db/memory";
import type { Scene } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { newId } from "@/lib/utils";

const slugAlphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no easily-confused chars
const makeSlug = customAlphabet(slugAlphabet, 8);

export interface CreateSceneInput {
  sourcePhotoUrl: string;
  title?: string;
  description?: string;
  userId?: string;
  anonymousEmail?: string;
}

export function createScene(input: CreateSceneInput): Scene {
  const id = newId("scn");
  const slug = makeSlug();
  if (env.MOCK_MODE) {
    return memScenes.insert({
      id,
      slug,
      sourcePhotoUrl: input.sourcePhotoUrl,
      title: input.title ?? "Untitled memory",
      description: input.description ?? null,
      userId: input.userId ?? null,
      anonymousEmail: input.anonymousEmail ?? null,
      status: "pending",
      paid: false,
    });
  }
  // Real DB path lands in phase 6 swap; for now we mirror mock behavior.
  return memScenes.insert({
    id,
    slug,
    sourcePhotoUrl: input.sourcePhotoUrl,
    title: input.title ?? "Untitled memory",
    description: input.description ?? null,
    userId: input.userId ?? null,
    anonymousEmail: input.anonymousEmail ?? null,
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
  return memScenes
    .list()
    .filter((s) => {
      if (opts.userId && s.userId === opts.userId) return true;
      if (opts.email && s.anonymousEmail === opts.email) return true;
      return false;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
