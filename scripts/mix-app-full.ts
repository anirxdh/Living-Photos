/**
 * Mix the 9 APP-XX narrator clips into a single ~96-second master that aligns
 * with public/app-demo/App-full.mp4, then overlay it onto the video LOSSLESSLY
 * (-c:v copy preserves the H.264 stream byte-for-byte — zero quality loss).
 *
 * Outputs:
 *   audio/app-full/APP-FULL-MASTER.mp3       — mixed narration only
 *   public/app-demo/App-full-with-audio.mp4  — video + narration baked in
 *
 * Run: pnpm tsx scripts/mix-app-full.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

interface Clip {
  file: string;
  startMs: number;
  volume: number;
}

const VOICE_VOL = 1.0;

// Timing tuned to fit inside App-full.mp4's 96.26s duration with natural breath
// gaps. Each clip starts a beat after the previous one ends.
const CLIPS: Clip[] = [
  { file: "audio/app-full/APP-01.mp3", startMs: 500, volume: VOICE_VOL }, // intro            (12.4s) ends ~12.9
  { file: "audio/app-full/APP-02.mp3", startMs: 13500, volume: VOICE_VOL }, // stripe           (6.0s)  ends ~19.5
  { file: "audio/app-full/APP-03.mp3", startMs: 21000, volume: VOICE_VOL }, // voice choice     (3.3s)  ends ~24.3
  { file: "audio/app-full/APP-04.mp3", startMs: 25500, volume: VOICE_VOL }, // upload + no humans (16.1s) ends ~41.6
  { file: "audio/app-full/APP-05.mp3", startMs: 43000, volume: VOICE_VOL }, // generation time  (5.5s)  ends ~48.5
  { file: "audio/app-full/APP-06.mp3", startMs: 49200, volume: VOICE_VOL }, // stripe + waitlist (11.2s) ends ~60.4
  { file: "audio/app-full/APP-07.mp3", startMs: 61500, volume: VOICE_VOL }, // inside controls  (16.0s) ends ~77.5
  { file: "audio/app-full/APP-08.mp3", startMs: 79000, volume: VOICE_VOL }, // github           (6.1s)  ends ~85.1
  { file: "audio/app-full/APP-09.mp3", startMs: 85500, volume: VOICE_VOL }, // closer           (10.7s) ends ~96.2
];

const AUDIO_OUT = "audio/app-full/APP-FULL-MASTER.mp3";
const VIDEO_IN = "public/app-demo/App-full.mp4";
const VIDEO_OUT = "public/app-demo/App-full-with-audio.mp4";
const PAGE_DURATION_SEC = 97;

function shellEscape(s: string): string {
  return `"${s.replace(/"/g, '\\"')}"`;
}

function mixAudio() {
  mkdirSync("audio/app-full", { recursive: true });

  const inputs = CLIPS.map((c) => `-i ${shellEscape(c.file)}`).join(" ");
  const filters = CLIPS.map(
    (c, i) => `[${i}:a]volume=${c.volume},adelay=${c.startMs}|${c.startMs}[a${i}]`,
  );
  const mixLabels = CLIPS.map((_, i) => `[a${i}]`).join("");
  const mixFilter = `${mixLabels}amix=inputs=${CLIPS.length}:duration=longest:dropout_transition=0:normalize=0[mixed]`;
  const masterFilter = `[mixed]volume=2.5,acompressor=threshold=-18dB:ratio=3:attack=20:release=200[out]`;
  const fullFilter = [...filters, mixFilter, masterFilter].join(";");

  const cmd = `ffmpeg -y ${inputs} -filter_complex "${fullFilter}" -map "[out]" -ac 2 -ar 48000 -b:a 192k -t ${PAGE_DURATION_SEC} ${AUDIO_OUT}`;

  console.log(`\n🎙  Mixing ${CLIPS.length} narrator clips → ${AUDIO_OUT}...`);
  execSync(cmd, { stdio: ["ignore", "ignore", "ignore"] });
  console.log(`   ✅ Done`);
}

function overlayOnVideo() {
  console.log(`\n🎬 Overlaying audio onto ${VIDEO_IN} (lossless — -c:v copy)...`);
  // -c:v copy keeps the H.264 stream untouched (no re-encode, no quality loss).
  // Audio is re-encoded as AAC 192k since MP3 in an MP4 container has worse
  // compatibility across players. AAC is the standard for MP4.
  const cmd = [
    "ffmpeg",
    "-y",
    `-i ${VIDEO_IN}`,
    `-i ${AUDIO_OUT}`,
    `-c:v copy`,
    `-c:a aac -b:a 192k`,
    `-map 0:v:0 -map 1:a:0`,
    `-movflags +faststart`, // makes the MP4 streamable / loads faster
    `-shortest`,
    VIDEO_OUT,
  ].join(" ");

  execSync(cmd, { stdio: ["ignore", "ignore", "ignore"] });
  console.log(`   ✅ Done → ${VIDEO_OUT}`);
}

function main() {
  mixAudio();
  overlayOnVideo();
  console.log(`\n✨ Complete!`);
  console.log(`   Audio: ${AUDIO_OUT}`);
  console.log(`   Video: ${VIDEO_OUT}`);
  console.log(`   Open:  open ${VIDEO_OUT}\n`);
}

main();
