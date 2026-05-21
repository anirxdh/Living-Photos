/**
 * Maximum-quality enhancement of Final-video-full.mp4.
 *
 * Pipeline:
 *  1. hqdn3d=2:1:3:2 — gentle 3D denoise (removes compression grain)
 *  2. unsharp=5:5:1.5:5:5:0.3 — sharpening (5x5 luma kernel, strength 1.5)
 *  3. eq contrast +6% saturation +10% — subtle color pop
 *  4. scale 2x lanczos — high-quality upscale (1632→3264 wide)
 *  5. libx264 crf 15 preset slower — visually identical to source quality
 *  6. AAC audio kept (source is already 230kbps which is excellent)
 *
 * Result: ~3264×1856, visually identical-or-better, ~300-500 MB.
 *
 * Run: pnpm tsx scripts/enhance-final-video.ts
 * Output: public/app-demo/Final-video-full-MAX.mp4
 */
import { execSync } from "node:child_process";

const VIDEO_IN = "public/app-demo/Final-video-full.mp4";
const VIDEO_OUT = "public/app-demo/Final-video-full-MAX.mp4";

function main() {
  const vf = [
    // Gentle denoise — removes any compression grain without losing detail
    "hqdn3d=2:1:3:2",
    // Sharpen — boosts perceived detail
    "unsharp=5:5:1.5:5:5:0.3",
    // Subtle color pop
    "eq=contrast=1.06:saturation=1.10",
    // 2x upscale with lanczos
    "scale=iw*2:ih*2:flags=lanczos",
  ].join(",");

  const cmd = [
    "ffmpeg -y",
    `-i ${VIDEO_IN}`,
    `-vf "${vf}"`,
    `-c:v libx264 -crf 15 -preset slower -pix_fmt yuv420p`, // crf 15 = visually transparent, preset slower = best compression
    `-profile:v high -level 5.1`, // supports 4K-ish dimensions
    `-c:a aac -b:a 256k`, // bump audio slightly above source for safety
    `-movflags +faststart`,
    VIDEO_OUT,
  ].join(" ");

  console.log(`\n🎞  Max-quality enhancement of ${VIDEO_IN}`);
  console.log(`   Pipeline: denoise → sharpen → color → 2x lanczos upscale → crf 15 preset slower`);
  console.log(`   Source: 1632×928, 3:40, ~152 MB`);
  console.log(`   Target: ~3264×1856, ~300-500 MB`);
  console.log(`   Time:   15-25 min on Apple M4`);

  const start = Date.now();
  execSync(cmd, { stdio: "inherit" });
  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);

  console.log(`\n✨ Done in ${elapsed} minutes`);
  console.log(`   Output: ${VIDEO_OUT}\n`);
}

main();
