/**
 * V2: Merge 123start-with-audio.mp4 + Story-enhanced.mp4 using the concat
 * filter (single re-encode) instead of demuxer + -c copy.
 *
 * Why: The -c copy concat approach in v1 "succeeded" but produced a broken
 * file because the encoder params (profile/level/SAR/PTS) of the two clips
 * didn't match perfectly. ffmpeg doesn't validate this with -c copy.
 *
 * V2 re-encodes everything in one pass — slower but GUARANTEED to play
 * correctly throughout. Uses crf 17 (visually transparent).
 *
 * Run: pnpm tsx scripts/merge-start-and-story-v2.ts
 * Output: public/app-demo/Story-with-123start.mp4 (overwrites v1)
 */
import { execSync } from "node:child_process";

const START_IN = "public/app-demo/123start-with-audio.mp4";
const STORY_IN = "public/app-demo/Story-enhanced.mp4";
const OUT = "public/app-demo/Story-with-123start.mp4";

const TARGET_W = 2756;
const TARGET_H = 2044;
const TARGET_FPS = 60;

function main() {
  console.log("🎬 Single-pass concat re-encode (concat filter)");
  console.log(`   Inputs:`);
  console.log(`     - ${START_IN} (will be scaled+padded to ${TARGET_W}x${TARGET_H})`);
  console.log(`     - ${STORY_IN} (already ${TARGET_W}x${TARGET_H})`);
  console.log(`   Output: ${OUT}`);
  console.log(`   Quality: crf 17 (visually transparent)`);
  console.log(`   Expected time: 5-8 minutes for 124s of ${TARGET_W}×${TARGET_H} 60fps video`);

  // Scale + pad first input to match story dimensions, then concat both
  // video and audio streams in one filter graph.
  const filterComplex = [
    // Process start input: scale to fit + letterbox + lock fps + lock SAR
    `[0:v]scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease:flags=lanczos,`,
    `pad=${TARGET_W}:${TARGET_H}:(ow-iw)/2:(oh-ih)/2:color=black,`,
    `fps=${TARGET_FPS},setsar=1[v0];`,
    // Match start audio rate to story (48000 Hz stereo)
    `[0:a]aresample=48000,aformat=channel_layouts=stereo[a0];`,
    // Process story input: lock fps + sar
    `[1:v]fps=${TARGET_FPS},setsar=1[v1];`,
    `[1:a]aresample=48000,aformat=channel_layouts=stereo[a1];`,
    // Concatenate
    `[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]`,
  ].join("");

  const cmd = [
    "ffmpeg -y",
    `-i ${START_IN}`,
    `-i ${STORY_IN}`,
    `-filter_complex "${filterComplex}"`,
    `-map "[v]" -map "[a]"`,
    `-c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p`,
    `-profile:v high -level 4.2`,
    `-c:a aac -b:a 192k -ar 48000`,
    `-movflags +faststart`,
    OUT,
  ].join(" ");

  console.log(`\n→ Encoding...`);
  const start = Date.now();
  execSync(cmd, { stdio: "inherit" });
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\n✨ Done in ${elapsed}s`);
  console.log(`   Output: ${OUT}\n`);
}

main();
