/**
 * Enhance Story.mov: denoise + sharpen + 2x upscale via ffmpeg.
 *
 * Pipeline:
 *  1. hqdn3d         — high-quality 3D denoiser (removes grain that makes blur look worse)
 *  2. unsharp        — sharpening filter (5×5 luma matrix at strength 1.5)
 *  3. eq             — subtle contrast + saturation boost so colors don't go flat after sharpen
 *  4. scale lanczos  — 2x upscale (1378→2756 wide) using high-quality lanczos algorithm
 *  5. libx264 crf 18 — visually lossless H.264 encode, preset slow for best compression
 *
 * Audio is copied byte-for-byte (no re-encode).
 *
 * Run: pnpm tsx scripts/enhance-story.ts
 */
import { execSync } from "node:child_process";

const VIDEO_IN = "public/app-demo/Story.mov";
const VIDEO_OUT = "public/app-demo/Story-enhanced.mp4";

function main() {
  const vf = [
    // Gentle denoise (preserves detail, removes compression grain)
    "hqdn3d=2:1:3:2",
    // Sharpen — 5×5 luma kernel, strength 1.5 (moderate but visible)
    "unsharp=5:5:1.5:5:5:0.3",
    // Subtle pop — colors stay punchy after sharpening
    "eq=contrast=1.08:saturation=1.12:brightness=0.02",
    // 2x upscale with lanczos (best for upscaling existing detail)
    "scale=iw*2:ih*2:flags=lanczos",
  ].join(",");

  const cmd = [
    "ffmpeg",
    "-y",
    `-i ${VIDEO_IN}`,
    `-vf "${vf}"`,
    `-c:v libx264`,
    `-crf 18`, // visually lossless
    `-preset slow`, // better compression
    `-pix_fmt yuv420p`, // broadest player compatibility
    `-c:a copy`, // audio untouched
    `-movflags +faststart`,
    VIDEO_OUT,
  ].join(" ");

  console.log(`\n🎞  Enhancing ${VIDEO_IN}...`);
  console.log(`   Denoise → Sharpen → Color boost → 2x upscale → H.264 crf 18`);
  console.log(`   This takes a few minutes for a 2-min 60fps source. Apple M4 helps.\n`);

  const start = Date.now();
  execSync(cmd, { stdio: "inherit" });
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);

  console.log(`\n✨ Done in ${elapsed}s`);
  console.log(`   Output: ${VIDEO_OUT}\n`);
}

main();
