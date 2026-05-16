import { type ClassValue, clsx } from "clsx";
import { customAlphabet } from "nanoid";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL-safe 12-char id for scenes, voice clones, share slugs. */
const idAlphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nanoid12 = customAlphabet(idAlphabet, 12);
export const newId = (prefix: string) => `${prefix}_${nanoid12()}`;

/** Deterministic mock id from a seed string — used by Mock adapters. */
export function mockId(prefix: string, seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  const hex = (h >>> 0).toString(36).padStart(8, "0");
  return `${prefix}_mock_${hex}`;
}
