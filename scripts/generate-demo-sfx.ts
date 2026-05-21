/**
 * Generate ambient/foley SFX via ElevenLabs Sound Generation API.
 * All 18 SFX for the demo, can be regenerated individually with --only=SFX-XX
 *
 * Run: pnpm tsx scripts/generate-demo-sfx.ts
 *      pnpm tsx scripts/generate-demo-sfx.ts --only=SFX-03,SFX-04
 *      pnpm tsx scripts/generate-demo-sfx.ts --slot=1   (generate just the 5 for SLOT 1)
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

const OUT_DIR = "audio/sfx";

interface SfxClip {
  id: string;
  slot: number; // which slot/page this belongs to
  durationSec: number;
  prompt: string;
}

const CLIPS: SfxClip[] = [
  // ───── SLOT 1: SF intro + sweeping + chest discovery + POOF ─────
  {
    id: "SFX-01",
    slot: 1,
    durationSec: 3,
    prompt:
      "Distant futuristic city ambient drone, soft autonomous vehicle whirr, morning atmospheric haze, no music",
  },
  {
    id: "SFX-02",
    slot: 1,
    durationSec: 5,
    prompt:
      "Old straw broom sweeping rhythmically on dusty wooden floor, dry slow rhythmic swishing back and forth, indoor library",
  },
  {
    id: "SFX-03",
    slot: 1,
    durationSec: 1.5,
    prompt:
      "Heavy old hardcover books falling and thudding onto wooden floor, sharp impact then quieter secondary thuds, dramatic",
  },
  {
    id: "SFX-04",
    slot: 1,
    durationSec: 2,
    prompt:
      "Huge dust cloud explosion whoosh, sudden big poof of dust into the air, soft impact then airy whoosh fading",
  },
  {
    id: "SFX-05",
    slot: 1,
    durationSec: 2,
    prompt: "Elderly old man coughing softly twice from dust, dry raspy kaff kaff cough, indoor",
  },

  // ───── SLOT 2: chest interior / book reveal / photo glow ─────
  {
    id: "SFX-06",
    slot: 2,
    durationSec: 1,
    prompt: "Old wooden chest hinge creaking open, single short quick creak, dry aged wood, brief",
  },
  {
    id: "SFX-07",
    slot: 2,
    durationSec: 3,
    prompt: "Old paper photographs being gently shuffled and handled, soft rustling, indoor close",
  },
  {
    id: "SFX-08",
    slot: 2,
    durationSec: 2,
    prompt:
      "Soft magical golden chime with sparkle shimmer, ethereal brief twinkling magical reveal",
  },

  // ───── SLOT 3: FWOOOSH transition + house + door ─────
  {
    id: "SFX-09",
    slot: 3,
    durationSec: 3,
    prompt:
      "Whooshing magical wind transition with low rumble building to peak then dissolving, cinematic transformation",
  },
  {
    id: "SFX-10",
    slot: 3,
    durationSec: 6,
    prompt:
      "Suburban American summer afternoon ambience, distant cicadas, light wind in trees, faint lawn mower far away, peaceful",
  },
  {
    id: "SFX-11",
    slot: 3,
    durationSec: 2,
    prompt: "Old wooden front door slowly creaking open, single long creak with door knob turn",
  },
  {
    id: "SFX-12",
    slot: 3,
    durationSec: 4,
    prompt: "Slow contemplative footsteps walking on old wooden floor indoor, soft and deliberate",
  },

  // ───── SLOT 4: inside house / dad's voice / memory ─────
  {
    id: "SFX-13",
    slot: 4,
    durationSec: 6,
    prompt:
      "Old grandfather pendulum clock ticking distantly in another room, soft tick tock tick tock",
  },
  {
    id: "SFX-14",
    slot: 4,
    durationSec: 2,
    prompt: "Woman laughing softly from another room, warm distant brief female laugh",
  },
  {
    id: "SFX-15",
    slot: 4,
    durationSec: 3,
    prompt:
      "Reverse magical whoosh dissolving into shimmering particles, ethereal departure transition",
  },

  // ───── SLOT 5: rematerialize + daughter ─────
  {
    id: "SFX-16",
    slot: 5,
    durationSec: 3,
    prompt:
      "Magical sparkle particles converging into soft shimmer, ethereal arrival back to reality",
  },

  // ───── SLOT 6: final reveal ─────
  {
    id: "SFX-17",
    slot: 6,
    durationSec: 2,
    prompt:
      "Old folded paper being carefully unfolded, soft crinkle and rustle, single unfolding action",
  },
  {
    id: "SFX-18",
    slot: 6,
    durationSec: 3,
    prompt: "Soft warm emotional closing chime with golden glow shimmer, gentle musical bell",
  },
];

const SOUND_GEN_MAX_SEC = 22;

async function generateClip(clip: SfxClip): Promise<{ size: number } | null> {
  const outPath = join(OUT_DIR, `${clip.id}.mp3`);

  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: clip.prompt,
      duration_seconds: Math.min(clip.durationSec, SOUND_GEN_MAX_SEC),
      prompt_influence: 0.6,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.log(`❌ ${res.status} ${body.slice(0, 120)}`);
    return null;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  return { size: buf.length };
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const slotArg = args.find((a) => a.startsWith("--slot="));
  const onlyIds =
    onlyArg
      ?.slice("--only=".length)
      .split(",")
      .map((s) => s.trim()) ?? null;
  const onlySlot = slotArg ? parseInt(slotArg.slice("--slot=".length), 10) : null;

  let toGenerate = CLIPS;
  if (onlyIds) toGenerate = CLIPS.filter((c) => onlyIds.includes(c.id));
  if (onlySlot) toGenerate = toGenerate.filter((c) => c.slot === onlySlot);

  console.log(
    `\n🔊 Generating ${toGenerate.length} SFX clip(s) via ElevenLabs Sound Generation...\n`,
  );

  for (const clip of toGenerate) {
    process.stdout.write(`  ${clip.id} (slot ${clip.slot}, ${clip.durationSec}s)... `);
    const result = await generateClip(clip);
    if (result) {
      const kb = (result.size / 1024).toFixed(1);
      console.log(`✅ ${kb}KB`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n✨ Done. Files in ./${OUT_DIR}/\n`);
}

main().catch((e) => {
  console.error("\n💥 Failed:", e);
  process.exit(1);
});
