/**
 * Mix audio per-comic-page. Outputs 6 separate MP3 files so each page can be
 * tested and tuned independently before final video assembly.
 *
 * Music volume is lower than before (0.08 vs 0.16) so voices sit clearly on top.
 * Voice clips have more breathing room between them (0.5–1.0s gaps) for natural pacing.
 *
 * Run: pnpm tsx scripts/mix-pages.ts
 *      pnpm tsx scripts/mix-pages.ts --only=PAGE-04
 *
 * Outputs: audio/master/PAGE-01.mp3 ... PAGE-06.mp3
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

interface Clip {
  file: string;
  /** Start time in milliseconds, relative to the START of this page's audio */
  startMs: number;
  volume: number;
}

const MUSIC_VOL = 0.08; // ~-22 dB, well under voice
const FWOOOSH_VOL = 0.18; // FWOOOSH gets more punch
const VOICE_VOL = 1.0;
const SFX_AMBIENT_VOL = 0.18; // continuous ambience (city hum, broom, summer ambience) — under voice
const SFX_IMPACT_VOL = 0.45; // impact SFX (THUD, POOF, FWOOOSH) — punch through
const SFX_FOLEY_VOL = 0.3; // foley (cough, paper rustle, footsteps) — present but not dominant

interface Page {
  id: string;
  name: string;
  durationSec: number;
  clips: Clip[];
}

const PAGES: Page[] = [
  // ───────────────────────────────────────────────────────────────────────
  // PAGE 1 (SLOT 1) — Opening video + Walter sweeping + THUD + POOF
  // 0:00-0:03 = VIDEO (cloud descent → SF reveal)
  // 0:03-0:08 = Panel: Walter sweeping
  // 0:08-0:13 = Panel: Walter sweeping (continues, NARR-03 fills it)
  // 0:13-0:15 = Panel: THUD chest discovery
  // 0:15-0:20 = Panel: POOF dust explosion
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "PAGE-01",
    name: "Saturday Tradition",
    durationSec: 22, // extended to fit cough at the end
    clips: [
      // Music: TRACK-01 plays under the whole slot
      { file: "audio/music/TRACK-01.mp3", startMs: 0, volume: MUSIC_VOL },

      // Narration timing:
      // - NARR-01 starts at 1.0s while video plays, ends at 3.32s (slight bleed into Panel 2)
      // - Each narration has ~0.5s breathing gap
      { file: "audio/narrator/NARR-01.mp3", startMs: 1000, volume: VOICE_VOL }, // "It's the year 2067." (2.32s)  → ends 3.32s
      { file: "audio/narrator/NARR-02.mp3", startMs: 3800, volume: VOICE_VOL }, // "Every Saturday..." (2.32s)    → ends 6.12s
      { file: "audio/narrator/NARR-03.mp3", startMs: 6600, volume: VOICE_VOL }, // "This time, Walter..." (~4s)   → ends ~10.6s
      { file: "audio/narrator/NARR-04.mp3", startMs: 11100, volume: VOICE_VOL }, // "While cleaning..." (3.89s)    → ends ~15s
      { file: "audio/narrator/NARR-05.mp3", startMs: 15600, volume: VOICE_VOL }, // "He decided to open..." (3.66s) → ends ~19.3s

      // SFX layer
      { file: "audio/sfx/SFX-01.mp3", startMs: 0, volume: SFX_AMBIENT_VOL }, // city hum under video (3s)
      { file: "audio/sfx/SFX-02.mp3", startMs: 3500, volume: SFX_AMBIENT_VOL }, // broom sweeping under Walter's sweeping panel (5s)
      { file: "audio/sfx/SFX-03.mp3", startMs: 10800, volume: SFX_IMPACT_VOL }, // books THUD at panel transition (1.5s)
      { file: "audio/sfx/SFX-04.mp3", startMs: 15200, volume: SFX_IMPACT_VOL }, // dust POOF whoosh at panel transition (2s)
      { file: "audio/sfx/SFX-05.mp3", startMs: 19500, volume: SFX_FOLEY_VOL }, // Walter cough kaff kaff after narration (2s)
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // PAGE 2 (SLOT 2) — Living Photos book + FWOOOSH transition
  // 0:00-0:13 = Top panel: chest interior
  // 0:13-0:22 = Middle-left: Walter reading book
  // 0:22-0:31 = Middle-right: Walter holding photo (longer, holds for the glow line)
  // 0:31-0:37 = Bottom panel: FWOOOSH magical transition
  //
  // Changes from v1:
  // - SFX-06 chest creak is shorter (1s) and quieter (0.10)
  // - Removed WALT-03 "Dad..." (only WALT-02 "My childhood home..." stays)
  // - NARR-11 "seemed to glow" plays BEFORE the FWOOOSH so it's audible
  // - FWOOOSH music/SFX hits AT 0:31 (right after NARR-11 ends)
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "PAGE-02",
    name: "The Living Photos Book",
    durationSec: 35,
    clips: [
      // Music — TRACK-02 plays during discovery; TRACK-03 punches in at FWOOOSH
      { file: "audio/music/TRACK-02.mp3", startMs: 0, volume: MUSIC_VOL }, // 22s — discovery music
      { file: "audio/music/TRACK-03.mp3", startMs: 28500, volume: FWOOOSH_VOL }, // FWOOOSH swell after NARR-11

      // Narration + Walter dialogue (WALT-01 "Living... Photos?" REMOVED per feedback)
      { file: "audio/narrator/NARR-06.mp3", startMs: 1000, volume: VOICE_VOL }, // "Inside, he found three things." (2.35s)
      { file: "audio/narrator/NARR-07.mp3", startMs: 4000, volume: VOICE_VOL }, // "His father's old Polaroid..." (5.85s)
      { file: "audio/narrator/NARR-08.mp3", startMs: 11000, volume: VOICE_VOL }, // "He picked up the book first." (1.75s)
      { file: "audio/narrator/NARR-09.mp3", startMs: 13500, volume: VOICE_VOL }, // "Living Photos." (4.62s) → ends 18.12s
      // WALT-01 REMOVED, shifted everything below left by 2.5s
      { file: "audio/narrator/NARR-10.mp3", startMs: 19500, volume: VOICE_VOL }, // "Photographs he had almost forgotten." (2.32s)
      { file: "audio/walter/WALT-02.mp3", startMs: 22500, volume: VOICE_VOL }, // "My childhood home..." (1.67s)
      { file: "audio/narrator/NARR-11.mp3", startMs: 25000, volume: VOICE_VOL }, // "And one of them... seemed to glow." (2.87s) → ends 27.87s

      // SFX layer
      { file: "audio/sfx/SFX-06.mp3", startMs: 0, volume: 0.1 }, // chest creak — short + quiet (1s)
      { file: "audio/sfx/SFX-07.mp3", startMs: 11500, volume: SFX_FOLEY_VOL }, // paper rustling (3s)
      { file: "audio/sfx/SFX-08.mp3", startMs: 19500, volume: SFX_FOLEY_VOL }, // magical chime when photo glows (2s)
      { file: "audio/sfx/SFX-09.mp3", startMs: 28500, volume: SFX_IMPACT_VOL }, // FWOOOSH whoosh — hits with TRACK-03
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // PAGE 3 (SLOT 3) — Walter arrives at the old house
  // 0:00-0:05 = Top panel: FWOOOSH hand reaching (NARR-12 over silent FWOOOSH-echo)
  // 0:05-0:11 = Bottom-left: house exterior with white picket fence
  // 0:11-0:18 = Bottom-right: Walter opens the door, steps inside
  //
  // NARR-11 moved to PAGE-02 (where the photo glows).
  // TRACK-03 / SFX-09 already played at end of PAGE-02 (the FWOOOSH moment).
  // PAGE-03 starts with silence under NARR-12 — Walter waking up in the dream.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "PAGE-03",
    name: "The Old House",
    durationSec: 19,
    clips: [
      // Music — TRACK-04 "The House" warms up when house exterior appears
      { file: "audio/music/TRACK-04.mp3", startMs: 5000, volume: MUSIC_VOL }, // 6s warm acoustic

      // Narration
      { file: "audio/narrator/NARR-12.mp3", startMs: 300, volume: VOICE_VOL }, // "Then the world tilted..." (4.83s) - over FWOOOSH top panel
      { file: "audio/narrator/NARR-13.mp3", startMs: 5800, volume: VOICE_VOL }, // "He couldn't believe it..." (5.80s) - over house exterior
      { file: "audio/narrator/NARR-14.mp3", startMs: 12800, volume: VOICE_VOL }, // "The door was never locked." (1.70s) - over door

      // SFX
      { file: "audio/sfx/SFX-10.mp3", startMs: 5000, volume: SFX_AMBIENT_VOL }, // summer ambience cicadas + breeze (6s)
      { file: "audio/sfx/SFX-11.mp3", startMs: 11500, volume: SFX_FOLEY_VOL }, // door creak (2s)
      { file: "audio/sfx/SFX-12.mp3", startMs: 14800, volume: SFX_FOLEY_VOL }, // footsteps as Walter steps inside (4s)
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // PAGE 4 (SLOT 4) — Dad's Voice (THE HEART of the demo)
  // 0:00-0:04 = Top panel: Walter looking up, DAD? floating
  // 0:04-0:18 = Middle panel: top-down room, dad's monologue
  // 0:18-0:23 = Bottom-left: Walter smiling, kid voice
  // 0:23-0:37 = Bottom-right: family photo, dad's "to listener" + Walter's response
  // 0:37-0:40 = Dissolve out (transition to PAGE-05)
  //
  // TRACK-05 (32s) plays from 0:00-0:32. WALT-05 "It still feels like yesterday"
  // plays in silence at 0:34 — the silence makes the emotional weight land harder.
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "PAGE-04",
    name: "Dad's Voice",
    durationSec: 39,
    clips: [
      // Music — TRACK-05 emotional core (32s)
      { file: "audio/music/TRACK-05.mp3", startMs: 0, volume: MUSIC_VOL },

      // Ambient SFX — clock tick + mother laugh = the house feels alive
      { file: "audio/sfx/SFX-13.mp3", startMs: 0, volume: SFX_AMBIENT_VOL * 0.4 }, // clock tick (subtle, 6s)
      { file: "audio/sfx/SFX-14.mp3", startMs: 11000, volume: SFX_AMBIENT_VOL * 0.5 }, // mother laugh distant (2s)
      { file: "audio/sfx/SFX-15.mp3", startMs: 35500, volume: SFX_FOLEY_VOL }, // reverse magical whoosh dissolve — earlier now that WALT-05 is gone (3s)

      // Dialogue — the emotional spine (WALT-05 "It still feels like yesterday" REMOVED per feedback)
      { file: "audio/dad/DAD-01.mp3", startMs: 1500, volume: VOICE_VOL }, // "...Hey." (0.84s)
      { file: "audio/walter/WALT-04.mp3", startMs: 2800, volume: VOICE_VOL }, // "Dad?" (0.73s) - shocked whisper
      { file: "audio/dad/DAD-02.mp3", startMs: 4500, volume: VOICE_VOL }, // monologue (13.51s) → ends ~18s
      { file: "audio/kid/KID-01.mp3", startMs: 18500, volume: VOICE_VOL }, // "Dad! Come down for dinner!" (2.04s)
      { file: "audio/dad/DAD-03.mp3", startMs: 21000, volume: VOICE_VOL }, // "I'm coming, Walter!" (1.44s)
      { file: "audio/dad/DAD-04.mp3", startMs: 23000, volume: VOICE_VOL }, // "And if you're hearing this..." (10.45s) → ends ~33.5s
      // 2 seconds of silence after DAD-04 ends, then dissolve whoosh
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // PAGE 5 (SLOT 5) — Walter materializes back + Anna checks in + Polaroid
  // 0:00-0:06 = Top: Walter rematerializing in storage room (THMP HAAH SHHHHH)
  // 0:06-0:11 = Bottom-left: Anna at doorway concerned
  // 0:11-0:19 = Bottom-right: Walter holds Polaroid, smiles, responds
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "PAGE-05",
    name: "Return to Present",
    durationSec: 19,
    clips: [
      // Music — TRACK-06 "Return" (12s gentle ambient)
      { file: "audio/music/TRACK-06.mp3", startMs: 0, volume: MUSIC_VOL },

      // SFX
      { file: "audio/sfx/SFX-16.mp3", startMs: 0, volume: SFX_FOLEY_VOL }, // rematerialize shimmer (3s) — Walter arrives back
      { file: "audio/sfx/SFX-11.mp3", startMs: 5500, volume: SFX_FOLEY_VOL * 0.6 }, // door creak (subtle, Anna opens door)

      // Dialogue
      { file: "audio/anna/ANNA-01.mp3", startMs: 7000, volume: VOICE_VOL }, // "Dad? Everything alright? I heard a huge sound." (2.95s)
      { file: "audio/walter/WALT-06.mp3", startMs: 11000, volume: VOICE_VOL }, // "All good, sweetheart. Just an old memory." (3.06s)
      { file: "audio/narrator/NARR-15.mp3", startMs: 15000, volume: VOICE_VOL }, // "Some memories you don't visit. They visit you." (3.53s)
    ],
  },

  // ───────────────────────────────────────────────────────────────────────
  // PAGE 6 (SLOT 6) — Final reveal: the paper note + sponsor thank you
  // 0:00-0:06 = Top: Walter reaches into glowing chest, note visible
  // 0:06-0:11 = Bottom-left: Walter unfolds paper
  // 0:11-0:20 = Bottom-right: Note close-up, sponsor names + ElevenHacks credit
  // ───────────────────────────────────────────────────────────────────────
  {
    id: "PAGE-06",
    name: "Thank You",
    durationSec: 19,
    clips: [
      // Music — TRACK-07 "Thank You" closing theme (12s)
      { file: "audio/music/TRACK-07.mp3", startMs: 0, volume: MUSIC_VOL },

      // SFX
      { file: "audio/sfx/SFX-17.mp3", startMs: 4000, volume: SFX_FOLEY_VOL }, // paper unfold krinkl (2s)
      { file: "audio/sfx/SFX-18.mp3", startMs: 15300, volume: SFX_FOLEY_VOL }, // closing chime golden glow (3s) — moved up to flow with continuous narration

      // Narration — sponsor reveal flows continuously (no pauses between lines)
      { file: "audio/narrator/NARR-16.mp3", startMs: 1000, volume: VOICE_VOL }, // "And then he remembered — the note." (2.32s)
      { file: "audio/narrator/NARR-17.mp3", startMs: 7000, volume: VOICE_VOL }, // "Thanks to ElevenLabs. And Stripe." (3.11s) → ends ~10.1s
      { file: "audio/narrator/NARR-18.mp3", startMs: 10300, volume: VOICE_VOL }, // "For making this possible." (1.67s) → tight follow, ends ~12.0s
      { file: "audio/narrator/NARR-19.mp3", startMs: 12200, volume: VOICE_VOL }, // "Built for ElevenHacks 2026." (2.87s) → tight follow, ends ~15.1s
    ],
  },
];

function mixPage(page: Page) {
  const inputs = page.clips.map((c) => `-i ${shellEscape(c.file)}`).join(" ");
  const filters = page.clips.map(
    (c, i) => `[${i}:a]volume=${c.volume},adelay=${c.startMs}|${c.startMs}[a${i}]`,
  );
  const mixLabels = page.clips.map((_, i) => `[a${i}]`).join("");
  const mixFilter = `${mixLabels}amix=inputs=${page.clips.length}:duration=longest:dropout_transition=0:normalize=0[mixed]`;
  const masterFilter = `[mixed]volume=2.5,acompressor=threshold=-18dB:ratio=3:attack=20:release=200[out]`;
  const fullFilter = [...filters, mixFilter, masterFilter].join(";");

  const out = `audio/master/${page.id}.mp3`;
  const cmd = `ffmpeg -y ${inputs} -filter_complex "${fullFilter}" -map "[out]" -ac 2 -ar 44100 -b:a 192k -t ${page.durationSec} ${out} 2>&1 | tail -3`;

  process.stdout.write(
    `  ${page.id} "${page.name}" (${page.durationSec}s, ${page.clips.length} clips)... `,
  );
  execSync(cmd, { stdio: ["ignore", "ignore", "ignore"] });
  console.log(`✅ → ${out}`);
}

function main() {
  mkdirSync("audio/master", { recursive: true });

  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const onlyIds =
    onlyArg
      ?.slice("--only=".length)
      .split(",")
      .map((s) => s.trim()) ?? null;

  const toMix = onlyIds ? PAGES.filter((p) => onlyIds.includes(p.id)) : PAGES;

  console.log(
    `\n🎬 Mixing ${toMix.length} page(s) — voice on top, music at ${MUSIC_VOL} (~-22dB)\n`,
  );

  for (const page of toMix) {
    mixPage(page);
  }

  console.log(`\n✨ Done. Files in audio/master/`);
  console.log(`   Open all: open audio/master/PAGE-*.mp3\n`);
}

function shellEscape(s: string): string {
  return `"${s.replace(/"/g, '\\"')}"`;
}

main();
