#!/usr/bin/env tsx
/**
 * Download the demo fixture binaries (Gaussian splat + GLB mesh) that ship
 * with the project but are too large for git. Run once after a fresh clone:
 *
 *   pnpm fixtures:download
 *
 * What it fetches:
 *   - public/fixtures/living-room.spz       — real Marble bedroom output (~29 MB)
 *   - public/fixtures/living-room.lowpoly.spz — same (no lowpoly variant exists)
 *   - public/fixtures/object.glb            — Khronos Box.glb (~1.6 KB, valid GLB)
 *
 * Audio fixtures (narration.mp3, ambient.mp3) are committed to the repo
 * and don't need downloading.
 *
 * Safe to re-run — skips files that already exist with non-zero size.
 */
import { createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

interface Fixture {
  filename: string;
  url: string;
  expectedMinBytes: number; // sanity check — refuse a truncated download
}

const FIXTURES: Fixture[] = [
  {
    filename: "public/fixtures/living-room.spz",
    url: "https://storage.googleapis.com/forge-dev-public/marble-scenes/greyscale-room.spz",
    expectedMinBytes: 1_000_000, // 29MB real, anything <1MB is broken
  },
  {
    filename: "public/fixtures/object.glb",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb",
    expectedMinBytes: 1_000,
  },
];

async function downloadOne(f: Fixture): Promise<void> {
  const path = join(process.cwd(), f.filename);
  if (existsSync(path) && statSync(path).size > f.expectedMinBytes) {
    console.log(`  ✓ ${f.filename} (already exists)`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  const res = await fetch(f.url);
  if (!res.ok) throw new Error(`${f.url} → ${res.status} ${res.statusText}`);
  if (!res.body) throw new Error(`${f.url} → empty body`);
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(path));
  const got = statSync(path).size;
  if (got < f.expectedMinBytes) {
    throw new Error(
      `${f.filename}: only ${got} bytes (expected at least ${f.expectedMinBytes}). Download truncated.`,
    );
  }
  console.log(`  ↓ ${f.filename} (${(got / 1024 / 1024).toFixed(1)} MB)`);
}

async function main() {
  console.log("Downloading demo fixtures...");
  for (const f of FIXTURES) {
    try {
      await downloadOne(f);
    } catch (e) {
      console.error(`  ✗ ${f.filename}: ${e instanceof Error ? e.message : String(e)}`);
      process.exitCode = 1;
    }
  }
  // Copy living-room.spz → .lowpoly.spz so mobile path doesn't 404
  const main = join(process.cwd(), "public/fixtures/living-room.spz");
  const low = join(process.cwd(), "public/fixtures/living-room.lowpoly.spz");
  if (existsSync(main) && !existsSync(low)) {
    const { copyFileSync } = await import("node:fs");
    copyFileSync(main, low);
    console.log(`  ↓ public/fixtures/living-room.lowpoly.spz (copy)`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
