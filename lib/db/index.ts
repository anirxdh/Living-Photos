/**
 * Database client. Lazy — never opens a connection at import time, so the
 * MOCK_MODE pipeline can run without DATABASE_URL set.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function db() {
  if (_db) return _db;
  if (!env.DATABASE_URL || env.DATABASE_URL.includes("placeholder")) {
    // In mock mode, callers should use the in-memory store. Calling db() here
    // would be a programming error — throw loudly so tests fail fast.
    throw new Error("db() called without a real DATABASE_URL. Use lib/db/memory for MOCK_MODE.");
  }
  const sql = neon(env.DATABASE_URL);
  _db = drizzle(sql, { schema });
  return _db;
}

export { schema };
