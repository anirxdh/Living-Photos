/**
 * Mix voices + BGM into a single preview MP3.
 *
 * Builds an ffmpeg filter_complex with each clip placed at its timeline offset,
 * voice at 0 dB, music at ~-15 dB so it sits under dialogue.
 *
 * Run: pnpm tsx scripts/mix-demo-preview.ts
 * Output: audio/master/DEMO-PREVIEW.mp3
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

interface Clip {
  file: string;
  startMs: number;
  volume: number; // linear gain (1.0 = 0 dB, 0.18 ≈ -15 dB)
}

const MUSIC_VOL = 0.16; // ~-16 dB so dialogue sits clearly on top
const VOICE_VOL = 1.0;

// Timeline (in ms). Calculated from actual clip durations probed earlier.
const CLIPS: Clip[] = [
  // ---- MUSIC LAYER ----
  { file: "audio/music/TRACK-01.mp3", startMs: 0, volume: MUSIC_VOL }, // 14s
  { file: "audio/music/TRACK-02.mp3", startMs: 14000, volume: MUSIC_VOL }, // 22s → 36s
  { file: "audio/music/TRACK-03.mp3", startMs: 38000, volume: MUSIC_VOL * 1.5 }, // FWOOOSH, louder, 6s → 44s
  { file: "audio/music/TRACK-04.mp3", startMs: 44000, volume: MUSIC_VOL }, // 6s → 50s
  { file: "audio/music/TRACK-05.mp3", startMs: 50000, volume: MUSIC_VOL }, // 32s → 82s (Dad's voice scene)
  { file: "audio/music/TRACK-06.mp3", startMs: 82000, volume: MUSIC_VOL }, // 12s → 94s
  { file: "audio/music/TRACK-07.mp3", startMs: 100000, volume: MUSIC_VOL }, // 12s → 112s

  // ---- VOICE LAYER ----
  // Scene 1 — Opening
  { file: "audio/narrator/NARR-01.mp3", startMs: 500, volume: VOICE_VOL }, // 2.32s

  // Scene 2 — Saturday tradition
  { file: "audio/narrator/NARR-02.mp3", startMs: 3500, volume: VOICE_VOL }, // "Every Saturday..."
  { file: "audio/narrator/NARR-03.mp3", startMs: 6200, volume: VOICE_VOL }, // "This time, he decided..."
  { file: "audio/narrator/NARR-04.mp3", startMs: 10300, volume: VOICE_VOL }, // "While cleaning..."
  { file: "audio/narrator/NARR-05.mp3", startMs: 14600, volume: VOICE_VOL }, // "He decided to open it..."

  // Scene 3 — Inside the chest
  { file: "audio/narrator/NARR-06.mp3", startMs: 18800, volume: VOICE_VOL }, // "Inside, he found three things."
  { file: "audio/narrator/NARR-07.mp3", startMs: 21500, volume: VOICE_VOL }, // "His father's old Polaroid..."
  { file: "audio/narrator/NARR-08.mp3", startMs: 27800, volume: VOICE_VOL }, // "He picked up the book first."
  { file: "audio/narrator/NARR-09.mp3", startMs: 30000, volume: VOICE_VOL }, // "An old photo album. Living Photos."
  { file: "audio/walter/WALT-01.mp3", startMs: 35100, volume: VOICE_VOL }, // "Living... Photos?"
  { file: "audio/narrator/NARR-10.mp3", startMs: 37700, volume: VOICE_VOL }, // "Photographs he had almost forgotten."
  { file: "audio/walter/WALT-02.mp3", startMs: 40400, volume: VOICE_VOL }, // "My childhood home..."
  { file: "audio/walter/WALT-03.mp3", startMs: 42400, volume: VOICE_VOL }, // "Dad..."
  { file: "audio/narrator/NARR-11.mp3", startMs: 43500, volume: VOICE_VOL }, // "And one of them... seemed to glow."

  // Scene 4 — Transition (FWOOOSH lands at 38s, voice resumes)
  { file: "audio/narrator/NARR-12.mp3", startMs: 47000, volume: VOICE_VOL }, // "Then the world tilted..."
  { file: "audio/narrator/NARR-13.mp3", startMs: 52500, volume: VOICE_VOL }, // "He couldn't believe it. His childhood home."
  { file: "audio/narrator/NARR-14.mp3", startMs: 59000, volume: VOICE_VOL }, // "The door was never locked."

  // Scene 5 — Dad's message (TRACK-05 underneath, 50s-82s)
  { file: "audio/dad/DAD-01.mp3", startMs: 61500, volume: VOICE_VOL }, // "...Hey."
  { file: "audio/walter/WALT-04.mp3", startMs: 63000, volume: VOICE_VOL }, // "Dad?"
  { file: "audio/dad/DAD-02.mp3", startMs: 64500, volume: VOICE_VOL }, // monologue (13.51s)
  { file: "audio/kid/KID-01.mp3", startMs: 79000, volume: VOICE_VOL }, // "Dad! Come down for dinner!"
  { file: "audio/dad/DAD-03.mp3", startMs: 81500, volume: VOICE_VOL }, // "I'm coming, Walter!"
  { file: "audio/dad/DAD-04.mp3", startMs: 83500, volume: VOICE_VOL }, // "And if you're hearing this..." (10.45s)
  { file: "audio/walter/WALT-05.mp3", startMs: 94500, volume: VOICE_VOL }, // "It still feels like yesterday."

  // Scene 6 — Return + daughter
  { file: "audio/anna/ANNA-01.mp3", startMs: 98500, volume: VOICE_VOL }, // "Dad? Everything alright?..."
  { file: "audio/walter/WALT-06.mp3", startMs: 102000, volume: VOICE_VOL }, // "All good, sweetheart..."
  { file: "audio/narrator/NARR-15.mp3", startMs: 106000, volume: VOICE_VOL }, // "Some memories you don't visit..."

  // Scene 7 — Final reveal
  { file: "audio/narrator/NARR-16.mp3", startMs: 110000, volume: VOICE_VOL }, // "And then he remembered — the note."
  { file: "audio/narrator/NARR-17.mp3", startMs: 113000, volume: VOICE_VOL }, // "Thanks to ElevenLabs. And Stripe."
  { file: "audio/narrator/NARR-18.mp3", startMs: 116500, volume: VOICE_VOL }, // "For making this possible."
  { file: "audio/narrator/NARR-19.mp3", startMs: 118500, volume: VOICE_VOL }, // "Built for ElevenHacks 2026."
];

const OUT = "audio/master/DEMO-PREVIEW.mp3";

function main() {
  mkdirSync("audio/master", { recursive: true });

  // Build ffmpeg command
  const inputs = CLIPS.map((c) => `-i ${shellEscape(c.file)}`).join(" ");
  const filters = CLIPS.map((c, i) => {
    return `[${i}:a]volume=${c.volume},adelay=${c.startMs}|${c.startMs}[a${i}]`;
  });
  const mixLabels = CLIPS.map((_, i) => `[a${i}]`).join("");
  const mixFilter = `${mixLabels}amix=inputs=${CLIPS.length}:duration=longest:dropout_transition=0:normalize=0[mixed]`;
  // Apply gentle compression + boost so the final is loud enough
  const masterFilter = `[mixed]volume=2.5,acompressor=threshold=-18dB:ratio=3:attack=20:release=200[out]`;

  const fullFilter = [...filters, mixFilter, masterFilter].join(";");

  const cmd = `ffmpeg -y ${inputs} -filter_complex "${fullFilter}" -map "[out]" -ac 2 -ar 44100 -b:a 192k ${OUT}`;

  console.log(`\n🎬 Mixing ${CLIPS.length} clips into ${OUT}...\n`);
  execSync(cmd, { stdio: "inherit" });

  console.log(`\n✨ Done!\n   File: ${OUT}\n   Open: open ${OUT}\n`);
}

function shellEscape(s: string): string {
  return `"${s.replace(/"/g, '\\"')}"`;
}

main();
