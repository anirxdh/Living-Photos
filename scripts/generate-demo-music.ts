/**
 * Generate the 7 cinematic BGM tracks for the Living Photos demo.
 *
 * Tries ElevenLabs Music API first (POST /v1/music). If that returns 401/403/404
 * (i.e. your API key doesn't have Music beta access), falls back to
 * /v1/sound-generation which accepts music-like prompts but caps at ~22s and
 * produces slightly lower quality.
 *
 * Run: pnpm tsx scripts/generate-demo-music.ts
 *      pnpm tsx scripts/generate-demo-music.ts --only=TRACK-05    (regenerate one track)
 *      pnpm tsx scripts/generate-demo-music.ts --force-sfx        (skip Music, go straight to sound-generation)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const envFile = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [
        l.slice(0, idx).trim(),
        l
          .slice(idx + 1)
          .trim()
          .replace(/^"|"$/g, ""),
      ];
    }),
);

const API_KEY = env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY missing from .env.local");
  process.exit(1);
}

const OUT_DIR = "audio/music";

interface Track {
  id: string;
  name: string;
  durationSec: number;
  prompt: string;
}

const TRACKS: Track[] = [
  {
    id: "TRACK-01",
    name: "Awakening 2067",
    durationSec: 14,
    prompt:
      "Cinematic orchestral opening. Slow sustained warm strings violins violas cellos. Soft solo piano notes drifting through. Distant warm french horn sustained. Mysterious but warm and inviting. Morning atmospheric. No drums no percussion no synth. Slow build from quiet to gentle swell. Movie soundtrack quality.",
  },
  {
    id: "TRACK-02",
    name: "Discovery",
    durationSec: 22,
    prompt:
      "Tender curious orchestral theme. Soft solo piano arpeggios with gentle string section underneath strings and warm cello. Light flute accents. Building anticipation slowly from quiet contemplative beginning to gentle wonder. Nostalgic warm intimate. No drums no percussion no electronic elements. Slow tempo. Cinematic.",
  },
  {
    id: "TRACK-03",
    name: "FWOOOSH Transition",
    durationSec: 6,
    prompt:
      "Magical orchestral transformation swell. Sudden powerful string crescendo with cascading harp glissando and warm french horn rise into glowing reverb tail. Cinematic transition moment. Builds for 3 seconds peaks at 4 seconds then dissolves into soft warmth. Pure orchestral no drums.",
  },
  {
    id: "TRACK-04",
    name: "The House",
    durationSec: 6, // bumped from 4s — sound-gen API needs minimum
    prompt:
      "Warm nostalgic orchestral. Gentle solo piano with soft sustained strings cellos and violins. Warm summer afternoon feeling. Tender memory of home. Wistful but peaceful. No drums no percussion.",
  },
  {
    id: "TRACK-05",
    name: "Dad's Voice (emotional core)",
    durationSec: 32,
    prompt:
      "Intimate emotional instrumental film score. Solo piano melody with sustained warm cello and violin strings. Bittersweet and nostalgic. Slow tempo. Gentle build from sparse quiet opening to soft string swell at twenty seconds then peaceful piano resolution. No drums no percussion no vocals.",
  },
  {
    id: "TRACK-06",
    name: "Return",
    durationSec: 12,
    prompt:
      "Gentle orchestral return to reality. Soft sustained warm strings with sparse contemplative piano notes. Calm grounded peaceful resolution. Slow tempo. Cinematic light. No drums no percussion.",
  },
  {
    id: "TRACK-07",
    name: "Thank You",
    durationSec: 12,
    prompt:
      "Warm grateful uplifting closing orchestral theme. Soft strings violins and cellos with light piano and gentle harp arpeggios. Slow steady rise from soft beginning to peaceful resolution on warm major chord. Triumphant but humble. Movie ending credit roll feeling. No drums no percussion no vocals.",
  },
];

const SOUND_GEN_MAX_SEC = 22;

async function tryMusicApi(track: Track): Promise<Buffer | null> {
  const res = await fetch("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      prompt: track.prompt,
      music_length_ms: track.durationSec * 1000,
    }),
  });
  if (res.status === 200) {
    return Buffer.from(await res.arrayBuffer());
  }
  if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 422) {
    return null; // signal fallback
  }
  const body = await res.text();
  throw new Error(`Music API ${res.status}: ${body.slice(0, 300)}`);
}

async function generateSoundEffect(prompt: string, durationSec: number): Promise<Buffer> {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: Math.min(durationSec, SOUND_GEN_MAX_SEC),
      prompt_influence: 0.55,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sound generation ${res.status}: ${body.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function generateTrack(
  track: Track,
  forceSfx: boolean,
): Promise<{ method: string; size: number }> {
  if (!forceSfx) {
    try {
      const buf = await tryMusicApi(track);
      if (buf) {
        const path = join(OUT_DIR, `${track.id}.mp3`);
        writeFileSync(path, buf);
        return { method: "music-api", size: buf.length };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`     ⚠️  Music API errored, falling back to sound-gen: ${msg.slice(0, 100)}`);
    }
  }

  // Fallback: sound generation (split into segments if >22s)
  if (track.durationSec <= SOUND_GEN_MAX_SEC) {
    const buf = await generateSoundEffect(track.prompt, track.durationSec);
    const path = join(OUT_DIR, `${track.id}.mp3`);
    writeFileSync(path, buf);
    return { method: "sound-gen", size: buf.length };
  }

  // Long track — generate two segments and let the user stitch in CapCut
  const half = Math.ceil(track.durationSec / 2);
  const buf1 = await generateSoundEffect(
    `${track.prompt} (opening section, building gently)`,
    half,
  );
  const buf2 = await generateSoundEffect(
    `${track.prompt} (middle and resolution section, continuing seamlessly from prior)`,
    track.durationSec - half + 2,
  );
  writeFileSync(join(OUT_DIR, `${track.id}-part1.mp3`), buf1);
  writeFileSync(join(OUT_DIR, `${track.id}-part2.mp3`), buf2);
  return { method: "sound-gen (split into 2 parts)", size: buf1.length + buf2.length };
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const forceSfx = args.includes("--force-sfx");
  const onlyIds =
    onlyArg
      ?.slice("--only=".length)
      .split(",")
      .map((s) => s.trim()) ?? null;

  const toGenerate = onlyIds ? TRACKS.filter((t) => onlyIds.includes(t.id)) : TRACKS;

  console.log(`\n🎼 Generating ${toGenerate.length} BGM track(s)...`);
  console.log(
    forceSfx
      ? "   Mode: sound-generation API (forced)"
      : "   Mode: trying Music API first, falling back if needed\n",
  );

  for (const track of toGenerate) {
    process.stdout.write(`  ${track.id} "${track.name}" (${track.durationSec}s)... `);
    try {
      const { method, size } = await generateTrack(track, forceSfx);
      const kb = (size / 1024).toFixed(1);
      console.log(`✅ ${kb}KB via ${method}`);
    } catch (e) {
      console.log(`❌ ${e instanceof Error ? e.message.slice(0, 150) : String(e)}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n✨ Done. Tracks in ./${OUT_DIR}/\n`);
}

main().catch((e) => {
  console.error("\n💥 Failed:", e);
  process.exit(1);
});
