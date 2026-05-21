/**
 * Enhance the audio of Story-enhanced.mp4: louder + clearer + better dynamics.
 *
 * Audio filter chain:
 *  1. loudnorm I=-14:TP=-1.5:LRA=11 — broadcast loudness standard (Spotify/Netflix
 *     target). Makes everything noticeably louder without clipping.
 *  2. equalizer 200Hz +1.5dB — adds warmth to voices
 *  3. equalizer 3500Hz +1.5dB — adds presence/clarity to voices
 *  4. acompressor threshold=-22dB ratio=2.5 — evens out quiet vs loud parts
 *  5. AAC re-encode at 192 kbps (up from 128k)
 *
 * Video uses -c:v copy → byte-for-byte preserved, zero quality loss.
 *
 * Run: pnpm tsx scripts/enhance-story-audio.ts
 * Output: public/app-demo/Story-enhanced-louder.mp4
 */
import { execSync } from "node:child_process";

const VIDEO_IN = "public/app-demo/Story-enhanced.mp4";
const VIDEO_OUT = "public/app-demo/Story-enhanced-louder.mp4";

function main() {
  const af = [
    // Loudness normalize to broadcast standard (much louder than current)
    "loudnorm=I=-14:TP=-1.5:LRA=11",
    // Gentle warmth boost in voice frequencies
    "equalizer=f=200:t=q:w=1.0:g=1.5",
    // Presence/clarity boost for intelligibility
    "equalizer=f=3500:t=q:w=1.0:g=1.8",
    // Even out dynamics: bring up quiet parts, control peaks
    "acompressor=threshold=-22dB:ratio=2.5:attack=10:release=100:makeup=2",
    // Final limiter to prevent any clipping after makeup gain
    "alimiter=limit=0.95",
  ].join(",");

  const cmd = [
    "ffmpeg -y",
    `-i ${VIDEO_IN}`,
    `-af "${af}"`,
    `-c:v copy`, // video untouched — byte-for-byte
    `-c:a aac -b:a 192k -ar 48000 -ac 2`, // higher bitrate audio
    `-map 0:v:0 -map 0:a:0`,
    `-movflags +faststart`,
    VIDEO_OUT,
  ].join(" ");

  console.log(`\n🎙  Enhancing audio of ${VIDEO_IN}...`);
  console.log(`   Pipeline: loudnorm → warmth EQ → presence EQ → compressor → limiter`);
  console.log(`   Video: -c:v copy (zero re-encode)`);
  console.log(`   Audio: AAC 192k (up from 128k)`);

  const start = Date.now();
  execSync(cmd, { stdio: ["ignore", "ignore", "inherit"] });
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);

  console.log(`\n✨ Done in ${elapsed}s`);
  console.log(`   Output: ${VIDEO_OUT}\n`);
}

main();
