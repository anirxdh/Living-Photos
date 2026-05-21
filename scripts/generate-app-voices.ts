/**
 * Generate the 9 narrator clips for the App-full walkthrough demo.
 *
 * Outputs MP3s to audio/app-full/APP-01.mp3 ... APP-09.mp3
 *
 * Run: pnpm tsx scripts/generate-app-voices.ts
 *      pnpm tsx scripts/generate-app-voices.ts --only=APP-03,APP-09
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
  console.error("ELEVENLABS_API_KEY missing");
  process.exit(1);
}

const NARRATOR_VOICE_ID = "HIGUfNOdjuWQwwapnTRW";
const OUT_DIR = "audio/app-full";

interface Clip {
  id: string;
  text: string;
}

const CLIPS: Clip[] = [
  {
    id: "APP-01",
    text: "Living Photos lets you turn a photograph into a place you can walk through. Upload one image. We rebuild the entire space in 3D. Add a voice you love. Share it with anyone.",
  },
  {
    id: "APP-02",
    text: "Built with Stripe — so unlocking your memory is as secure as anything else you trust online.",
  },
  {
    id: "APP-03",
    text: "Pick a voice — yours, or one from our library.",
  },
  {
    id: "APP-04",
    text: "Upload a photograph of a place that matters. A room. A workshop. A garden. Just the space — no people in the frame. We rebuild everything that was around the camera the moment it was taken.",
  },
  {
    id: "APP-05",
    text: "Generation takes about five minutes. When it's ready, it appears in My Memories.",
  },
  {
    id: "APP-06",
    text: "To step inside, unlock with a one-time payment through Stripe. We're currently waitlist-only while we scale our generation credits — reach out to this account to get in.",
  },
  {
    id: "APP-07",
    text: "Inside, drag to look around. Scroll to zoom. Walk with W, A, S, D. And the voice you chose plays softly with you — the final touch that makes a memory feel alive.",
  },
  {
    id: "APP-08",
    text: "Want in without the waitlist? Clone the GitHub link below and use your own API keys.",
  },
  {
    id: "APP-09",
    text: "Give one to your parents. Your grandparents. Your kids. Some places only exist in memory — Living Photos is how we keep them.",
  },
];

async function generateClip(clip: Clip): Promise<void> {
  const outDir = OUT_DIR;
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${clip.id}.mp3`);

  process.stdout.write(`  ${clip.id}... `);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${NARRATOR_VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: clip.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.85,
        style: 0.4,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.log(`❌ ${res.status}`);
    console.error(`     ${body.slice(0, 300)}`);
    return;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`✅ ${kb}KB → ${outPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const onlyIds =
    onlyArg
      ?.slice("--only=".length)
      .split(",")
      .map((s) => s.trim()) ?? null;

  const toGenerate = onlyIds ? CLIPS.filter((c) => onlyIds.includes(c.id)) : CLIPS;

  console.log(`\n🎙️  Generating ${toGenerate.length} narrator clip(s) for app-full demo...\n`);

  for (const clip of toGenerate) {
    await generateClip(clip);
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n✨ Done. Files in ./${OUT_DIR}/\n`);
}

main().catch((e) => {
  console.error("\n💥 Failed:", e);
  process.exit(1);
});
