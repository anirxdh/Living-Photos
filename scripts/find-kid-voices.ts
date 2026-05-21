/**
 * Find kid voices in the ElevenLabs voice library and generate "Dad! Come down
 * for dinner!" with each so we can A/B compare and pick the best one.
 *
 * Outputs:
 *   audio/kid-options/OPTION-01-{name}.mp3 ... OPTION-10-{name}.mp3
 *   audio/kid-options/VOICES.md  (name + voice ID + ElevenLabs preview link)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

const OUT_DIR = "audio/kid-options";
const TEST_LINE = "Dad! Come down for dinner!";

interface SharedVoice {
  voice_id: string;
  name: string;
  category?: string;
  gender?: string;
  age?: string;
  accent?: string;
  description?: string;
  preview_url?: string;
  use_case?: string;
  labels?: Record<string, string>;
  language?: string;
  free_users_allowed?: boolean;
}

async function searchKidVoices(): Promise<SharedVoice[]> {
  console.log("🔍 Searching ElevenLabs voice library for TRUE kid voices...\n");

  const all: SharedVoice[] = [];
  // Broader queries — true child voices are rare so cast a wide net
  const queries = [
    "https://api.elevenlabs.io/v1/shared-voices?search=child&page_size=50",
    "https://api.elevenlabs.io/v1/shared-voices?search=kid&page_size=50",
    "https://api.elevenlabs.io/v1/shared-voices?search=little%20boy&page_size=30",
    "https://api.elevenlabs.io/v1/shared-voices?search=schoolboy&page_size=30",
    "https://api.elevenlabs.io/v1/shared-voices?search=10%20year%20old&page_size=30",
    "https://api.elevenlabs.io/v1/shared-voices?search=8%20year%20old&page_size=30",
    "https://api.elevenlabs.io/v1/shared-voices?use_case=characters_animation&page_size=80",
  ];

  for (const url of queries) {
    const res = await fetch(url, { headers: { "xi-api-key": API_KEY } });
    if (!res.ok) continue;
    const data = (await res.json()) as { voices?: SharedVoice[] };
    for (const v of data.voices ?? []) {
      if (!all.find((x) => x.voice_id === v.voice_id)) all.push(v);
    }
  }

  console.log(`  ${all.length} raw candidates collected.\n`);

  // STRICT filter: explicit child markers in name/description/labels
  const strictKidWords = [
    "child",
    "kid",
    "schoolboy",
    "school boy",
    "little boy",
    "young boy",
    "8 year",
    "9 year",
    "10 year",
    "7 year",
    "6 year",
    "boy voice",
    "boy character",
    "boy narrator",
  ];
  const blockWords = [
    "adult",
    "man with",
    "grown",
    "deep",
    "old man",
    "elderly",
    "raspy",
    "bhojpuri",
    "hindi",
    "thriller",
    "horror",
    "ASMR",
    "asmr",
    "vlogger",
    "narrative",
    "narrator deep",
  ];

  const scored = all.map((v) => {
    const blob = [
      v.name ?? "",
      v.description ?? "",
      v.age ?? "",
      v.use_case ?? "",
      JSON.stringify(v.labels ?? {}),
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const w of strictKidWords) if (blob.includes(w)) score += 5;
    for (const w of blockWords) if (blob.includes(w)) score -= 3;

    // Bonus: gender=male and age=young together
    const labels = v.labels ?? {};
    if (labels.age === "young" && labels.gender === "male") score += 3;
    if (labels.age?.toLowerCase().includes("child")) score += 8;

    return { voice: v, score, blob };
  });

  // Keep only positively-scored voices
  const filtered = scored
    .filter((s) => s.score >= 5)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.voice);

  console.log(`  ${filtered.length} pass the strict child-voice filter.\n`);
  return filtered;
}

async function generateSample(
  voice: SharedVoice,
  index: number,
): Promise<{ path: string; size: number } | null> {
  const safeName = voice.name.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30);
  const filename = `OPTION-${String(index).padStart(2, "0")}-${safeName}.mp3`;
  const outPath = join(OUT_DIR, filename);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: TEST_LINE,
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
    console.log(`  ❌ ${voice.name}: ${res.status} ${body.slice(0, 80)}`);
    return null;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  return { path: outPath, size: buf.length };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const candidates = await searchKidVoices();
  if (candidates.length === 0) {
    console.error("No kid voices found. Try widening the filter.");
    process.exit(1);
  }

  // Take top 10
  const picks = candidates.slice(0, 10);
  console.log(`🎙️  Generating "${TEST_LINE}" with ${picks.length} voices:\n`);

  const generated: Array<{ option: number; voice: SharedVoice; path: string; size: number }> = [];

  for (let i = 0; i < picks.length; i++) {
    const v = picks[i];
    process.stdout.write(
      `  OPTION-${String(i + 1).padStart(2, "0")} ${v.name.padEnd(30)} (${v.voice_id})... `,
    );
    const result = await generateSample(v, i + 1);
    if (result) {
      const kb = (result.size / 1024).toFixed(1);
      console.log(`✅ ${kb}KB`);
      generated.push({ option: i + 1, voice: v, path: result.path, size: result.size });
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  // Write the catalog markdown
  const md = [
    "# Kid Voice Options for KID-01",
    "",
    `Test line: **"${TEST_LINE}"**`,
    "",
    "Listen to each and pick your favorite. Then tell me the OPTION number or voice ID.",
    "",
    "| Option | Name | Voice ID | Description | Accent | File |",
    "| --- | --- | --- | --- | --- | --- |",
    ...generated.map((g) => {
      const desc = (g.voice.description ?? "").slice(0, 80).replace(/\|/g, "·").replace(/\n/g, " ");
      const accent = g.voice.accent ?? "—";
      const file = g.path.split("/").pop();
      return `| ${g.option} | **${g.voice.name}** | \`${g.voice.voice_id}\` | ${desc} | ${accent} | \`${file}\` |`;
    }),
    "",
    "## Once you pick",
    "",
    "Tell me the OPTION number and I'll:",
    "1. Update `KID_VOICE_ID` in `scripts/generate-demo-voices.ts`",
    "2. Regenerate `KID-01.mp3` with the new voice",
    "3. Re-mix `PAGE-04.mp3` with the new kid voice baked in",
    "",
  ].join("\n");

  const mdPath = join(OUT_DIR, "VOICES.md");
  writeFileSync(mdPath, md);

  console.log(`\n✨ Done. ${generated.length} samples in ${OUT_DIR}/`);
  console.log(`   Listen: open ${OUT_DIR}/`);
  console.log(`   Catalog: ${mdPath}\n`);
}

main().catch((e) => {
  console.error("\n💥 Failed:", e);
  process.exit(1);
});
