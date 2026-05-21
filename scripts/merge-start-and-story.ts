/**
 * Merge 123start-with-audio.mp4 + Story-enhanced.mp4 into one file.
 *
 * The two clips have different specs:
 *   123start: 1632 × 928, variable fps, H.264, AAC
 *   story:    2756 × 2044, 60 fps, H.264, AAC
 *
 * For lossless concat (-c copy), all streams must match exactly. Strategy:
 *   1. Re-encode 123start ONCE to match story specs:
 *      - scale to fit 2756x2044 with letterbox (preserves content + aspect)
 *      - force 60 fps
 *      - H.264 crf 17 (visually transparent)
 *      - AAC 128k, 48000 Hz, stereo
 *   2. Concat re-encoded intro + original story with `-c copy`
 *      (story stays byte-for-byte identical — full quality preserved)
 *
 * Run: pnpm tsx scripts/merge-start-and-story.ts
 * Output: public/app-demo/Story-with-123start.mp4
 */
import { execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";

const START_IN = "public/app-demo/123start-with-audio.mp4";
const STORY_IN = "public/app-demo/Story-enhanced.mp4";
const START_MATCHED = "/tmp/123start-matched.mp4";
const CONCAT_LIST = "/tmp/start-story-concat.txt";
const OUT = "public/app-demo/Story-with-123start.mp4";

const TARGET_W = 2756;
const TARGET_H = 2044;
const TARGET_FPS = 60;

function step(label: string, fn: () => void) {
  console.log(`\n→ ${label}`);
  fn();
}

function main() {
  step(`Re-encode 123start → ${TARGET_W}×${TARGET_H} letterbox @ ${TARGET_FPS}fps`, () => {
    const vf = [
      // Scale to fit within target dimensions (preserves aspect, may leave space)
      `scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease:flags=lanczos`,
      // Pad to exact target size with black bars (letterbox)
      `pad=${TARGET_W}:${TARGET_H}:(ow-iw)/2:(oh-ih)/2:color=black`,
      // Lock to target fps
      `fps=${TARGET_FPS}`,
    ].join(",");

    const cmd = [
      "ffmpeg -y",
      `-i ${START_IN}`,
      `-vf "${vf}"`,
      `-c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p`,
      `-profile:v high -level 4.2`,
      `-c:a aac -b:a 128k -ar 48000 -ac 2`,
      `-movflags +faststart`,
      START_MATCHED,
    ].join(" ");
    execSync(cmd, { stdio: ["ignore", "ignore", "ignore"] });
  });

  step("Concat intro + story (-c copy, lossless)", () => {
    writeFileSync(CONCAT_LIST, `file '${START_MATCHED}'\nfile '${process.cwd()}/${STORY_IN}'\n`);
    const cmd = [
      "ffmpeg -y",
      `-f concat -safe 0 -i ${CONCAT_LIST}`,
      `-c copy`,
      `-movflags +faststart`,
      OUT,
    ].join(" ");
    try {
      execSync(cmd, { stdio: ["ignore", "ignore", "pipe"] });
    } catch (_e) {
      // Fallback: if concat -c copy fails (encoder param mismatch), re-encode
      console.log("   ⚠️  Lossless concat failed, falling back to re-encode");
      const cmdReenc = [
        "ffmpeg -y",
        `-f concat -safe 0 -i ${CONCAT_LIST}`,
        `-c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p`,
        `-c:a aac -b:a 128k`,
        `-movflags +faststart`,
        OUT,
      ].join(" ");
      execSync(cmdReenc, { stdio: ["ignore", "ignore", "ignore"] });
    }
  });

  // Cleanup temp files (keep output)
  try {
    unlinkSync(START_MATCHED);
    unlinkSync(CONCAT_LIST);
  } catch {
    // ignore
  }

  console.log(`\n✨ Complete!`);
  console.log(`   Output: ${OUT}`);
  console.log(`   Open:   open ${OUT}\n`);
}

main();
