/**
 * Generate all 31 voice clips for the Living Photos demo via ElevenLabs TTS.
 *
 * Reads ELEVENLABS_API_KEY from .env.local
 * Writes MP3 files to /audio/{narrator,walter,dad,anna,kid}/
 *
 * Run: pnpm tsx scripts/generate-demo-voices.ts
 *      pnpm tsx scripts/generate-demo-voices.ts --only=NARR-01,WALT-02   (regenerate specific clips)
 *      pnpm tsx scripts/generate-demo-voices.ts --voice=dad              (regenerate one voice set)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Load .env.local manually (no dotenv import needed for a one-off)
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

const AUDIO_DIR = "audio";

interface Clip {
  id: string;
  folder: string;
  voiceId: string;
  text: string;
}

const VOICES = {
  narrator: "HIGUfNOdjuWQwwapnTRW",
  walter: "1fbWdjGLEPnGr6l5fQuf",
  dad: "r91coygYcgbv31fpHQ7s",
  anna: "uIcuMM41cZqo2iDgQbCW",
  kid: "eppqEXVumQ3CfdndcIBd", // Minnie — high pitch cartoon character
};

const CLIPS: Clip[] = [
  // NARRATOR
  { id: "NARR-01", folder: "narrator", voiceId: VOICES.narrator, text: "It's the year 2067." },
  {
    id: "NARR-02",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "Every Saturday, there was a tradition.",
  },
  {
    id: "NARR-03",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "This time, Walter decided to clean his dad's old storage.",
  },
  {
    id: "NARR-04",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "While cleaning, he suddenly stumbled upon his dad's chest.",
  },
  {
    id: "NARR-05",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "He decided to open it. And see what was inside.",
  },
  {
    id: "NARR-06",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "Inside, he found three things.",
  },
  {
    id: "NARR-07",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "His father's old Polaroid camera. A leather-bound book. And a folded note.",
  },
  {
    id: "NARR-08",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "He picked up the book first.",
  },
  {
    id: "NARR-09",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "An old photo album. The cover read: Living Photos.",
  },
  {
    id: "NARR-10",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "Photographs he had almost forgotten.",
  },
  {
    id: "NARR-11",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "And one of them... seemed to glow.",
  },
  {
    id: "NARR-12",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "Then the world tilted. And the photograph swallowed him whole.",
  },
  {
    id: "NARR-13",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "He couldn't believe it. His childhood home. Exactly as he remembered it.",
  },
  {
    id: "NARR-14",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "The door was never locked.",
  },
  {
    id: "NARR-15",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "Some memories you don't visit. They visit you.",
  },
  {
    id: "NARR-16",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "And then he remembered — the note.",
  },
  {
    id: "NARR-17",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "Thanks to ElevenLabs. And Stripe.",
  },
  {
    id: "NARR-18",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "For making this possible.",
  },
  {
    id: "NARR-19",
    folder: "narrator",
    voiceId: VOICES.narrator,
    text: "Built for ElevenHacks 2026.",
  },

  // WALTER
  { id: "WALT-01", folder: "walter", voiceId: VOICES.walter, text: "Living... Photos?" },
  { id: "WALT-02", folder: "walter", voiceId: VOICES.walter, text: "My childhood home..." },
  { id: "WALT-03", folder: "walter", voiceId: VOICES.walter, text: "Dad..." },
  { id: "WALT-04", folder: "walter", voiceId: VOICES.walter, text: "Dad?" },
  {
    id: "WALT-05",
    folder: "walter",
    voiceId: VOICES.walter,
    text: "It still feels like yesterday.",
  },
  {
    id: "WALT-06",
    folder: "walter",
    voiceId: VOICES.walter,
    text: "All good, sweetheart. Just an old memory.",
  },

  // DAD
  { id: "DAD-01", folder: "dad", voiceId: VOICES.dad, text: "...Hey." },
  {
    id: "DAD-02",
    folder: "dad",
    voiceId: VOICES.dad,
    text: "Every wall in here has heard something worth remembering. Birthdays. Arguments. A whole lot of laughter. A little bit of heartbreak. But honestly... everything worth living for.",
  },
  { id: "DAD-03", folder: "dad", voiceId: VOICES.dad, text: "I'm coming, Walter!" },
  {
    id: "DAD-04",
    folder: "dad",
    voiceId: VOICES.dad,
    text: "And if you're hearing this... save what matters to you. Pictures fade. But the way they made you feel? They're the only thing worth keeping.",
  },

  // ANNA
  {
    id: "ANNA-01",
    folder: "anna",
    voiceId: VOICES.anna,
    text: "Dad? Everything alright? I heard a huge sound.",
  },

  // KID
  { id: "KID-01", folder: "kid", voiceId: VOICES.kid, text: "Dad! Come down for dinner!" },
];

async function generateClip(clip: Clip): Promise<void> {
  const outDir = join(AUDIO_DIR, clip.folder);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${clip.id}.mp3`);

  process.stdout.write(`  ${clip.id}... `);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${clip.voiceId}`, {
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
        stability: 0.55,
        similarity_boost: 0.85,
        style: 0.35,
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
  // Parse args
  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const voiceArg = args.find((a) => a.startsWith("--voice="));
  const onlyIds =
    onlyArg
      ?.slice("--only=".length)
      .split(",")
      .map((s) => s.trim()) ?? null;
  const onlyVoice = voiceArg?.slice("--voice=".length).trim() ?? null;

  let toGenerate = CLIPS;
  if (onlyIds) toGenerate = CLIPS.filter((c) => onlyIds.includes(c.id));
  if (onlyVoice) toGenerate = toGenerate.filter((c) => c.folder === onlyVoice);

  console.log(`\n🎙️  Generating ${toGenerate.length} voice clip(s) via ElevenLabs...\n`);

  // Group by folder for cleaner output
  const byFolder: Record<string, Clip[]> = {};
  for (const c of toGenerate) {
    if (!byFolder[c.folder]) byFolder[c.folder] = [];
    byFolder[c.folder].push(c);
  }

  for (const [folder, clips] of Object.entries(byFolder)) {
    console.log(`\n📁 ${folder.toUpperCase()} (${clips.length} clips)`);
    for (const clip of clips) {
      await generateClip(clip);
      // Small delay between requests to avoid rate-limiting
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  console.log(`\n✨ Done. Files in ./${AUDIO_DIR}/\n`);
}

main().catch((e) => {
  console.error("\n💥 Failed:", e);
  process.exit(1);
});
