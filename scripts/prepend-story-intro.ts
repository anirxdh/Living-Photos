/**
 * Prepend "It's the year 2067" intro (SFX + NARR-01) to Story-enhanced.mp4
 *
 * Strategy:
 *  1. Extract first frame of Story-enhanced.mp4 as PNG
 *  2. Build a 5s "intro clip" video from that frame at EXACTLY the same specs
 *     as Story-enhanced.mp4 (2756×2044, 60fps, H.264) with the intro audio
 *  3. Concat that intro clip + Story-enhanced.mp4 with `-c copy` (lossless)
 *
 * Result: Story-enhanced-with-intro.mp4 (~124s) starts with the sky-descent
 * SFX + "It's the year 2067" narration, then transitions seamlessly into the
 * existing story narration. The main story video stays byte-for-byte identical.
 *
 * Run: pnpm tsx scripts/prepend-story-intro.ts
 */
import { execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";

const STORY_IN = "public/app-demo/Story-enhanced.mp4";
const INTRO_AUDIO = "audio/app-full/123start-audio.mp3";
const FRAME0 = "/tmp/story-frame0.png";
const INTRO_CLIP = "/tmp/story-intro-clip.mp4";
const CONCAT_LIST = "/tmp/story-concat-list.txt";
const STORY_OUT = "public/app-demo/Story-enhanced-with-intro.mp4";

const INTRO_DURATION_SEC = 5;

function step(label: string, fn: () => void) {
  console.log(`\n→ ${label}`);
  fn();
}

function main() {
  // 1. Extract first frame
  step("Extract first frame of Story-enhanced.mp4", () => {
    execSync(`ffmpeg -y -i ${STORY_IN} -vframes 1 ${FRAME0} 2>&1 | tail -1`, {
      stdio: ["ignore", "ignore", "ignore"],
    });
  });

  // 2. Build 5s intro clip matching Story-enhanced.mp4 specs:
  //    2756×2044, 60fps, H.264, yuv420p, AAC 128kbps
  step(`Build ${INTRO_DURATION_SEC}s intro clip (matching story specs)`, () => {
    const cmd = [
      "ffmpeg -y",
      `-loop 1 -framerate 60 -t ${INTRO_DURATION_SEC} -i ${FRAME0}`,
      `-i ${INTRO_AUDIO}`,
      `-c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p`,
      `-vf "scale=2756:2044:flags=lanczos,fps=60"`,
      `-c:a aac -b:a 128k -ar 48000`,
      `-t ${INTRO_DURATION_SEC}`,
      `-movflags +faststart`,
      INTRO_CLIP,
    ].join(" ");
    execSync(cmd, { stdio: ["ignore", "ignore", "ignore"] });
  });

  // 3. Concat losslessly
  step("Concatenate intro + story (lossless -c copy)", () => {
    writeFileSync(CONCAT_LIST, `file '${INTRO_CLIP}'\nfile '${process.cwd()}/${STORY_IN}'\n`);
    const cmd = [
      "ffmpeg -y",
      `-f concat -safe 0 -i ${CONCAT_LIST}`,
      `-c copy`,
      `-movflags +faststart`,
      STORY_OUT,
    ].join(" ");
    execSync(cmd, { stdio: ["ignore", "ignore", "ignore"] });
  });

  // Cleanup temp files
  try {
    unlinkSync(FRAME0);
    unlinkSync(INTRO_CLIP);
    unlinkSync(CONCAT_LIST);
  } catch {
    // ignore
  }

  console.log(`\n✨ Complete!`);
  console.log(`   Output: ${STORY_OUT}`);
  console.log(`   Open:   open ${STORY_OUT}\n`);
}

main();
