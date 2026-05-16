/**
 * Vitest setup — forces MOCK_MODE and resets in-memory state between tests.
 */
import { afterEach, beforeEach } from "vitest";
import { resetAdapters } from "@/lib/ai/factory";
import { resetMemoryStore } from "@/lib/db/memory";

process.env.MOCK_MODE = "true";
// NODE_ENV is readonly under @types/node 22+; vitest already sets it to "test".

beforeEach(() => {
  resetMemoryStore();
  resetAdapters();
});

afterEach(() => {
  resetMemoryStore();
  resetAdapters();
});
