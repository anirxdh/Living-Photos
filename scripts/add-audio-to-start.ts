/**
 * Add opening audio to 123start.mp4 (NO video extension).
 *
 *  0:00          → TRACK-01 "Awakening 2067" music starts (same track story uses)
 *  0:00          → sky wind SFX starts
 *  0:00.4 - 0:04.66 → NARR-INTRO "It's the year 2067. Walter is seventy now."
 *  0:04.7 - 0:04.96 → SFX gentle tail fade
 *
 * Music continues seamlessly into the story (which also opens with TRACK-01)
 * — eliminates the abrupt sonic change at the cut.
 *
 * Audio fits exactly in the 4.96s video duration → we use `-c:v copy` (lossless).
 *
 * Run: pnpm tsx scripts/add-audio-to-start.ts
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

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

const SFX_OUT = "audio/sfx/SFX-INTRO-01.mp3";
const NARR_INTRO = "audio/narrator/NARR-INTRO.mp3";
const MUSIC_TRACK = "audio/music/TRACK-01.mp3"; // same music story opens with
const AUDIO_OUT = "audio/app-full/123start-audio.mp3";
const VIDEO_IN = "public/app-demo/123start.mp4";
const VIDEO_OUT = "public/app-demo/123start-with-audio.mp4";

const SFX_PROMPT =
  "Cinematic atmospheric high altitude flight through clouds, prominent wind whoosh sweeping past camera, gentle deep ambient drone underneath building presence, ethereal dreamy aerial movement, immersive but not loud";
const SFX_DURATION_SEC = 5;
const VIDEO_DURATION_SEC = 4.96; // 123start.mp4 native duration

async function generateSfx() {
  mkdirSync("audio/sfx", { recursive: true });
  console.log(`🔊 Generating sky-descent SFX (${SFX_DURATION_SEC}s)...`);
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: SFX_PROMPT,
      duration_seconds: SFX_DURATION_SEC,
      prompt_influence: 0.5,
    }),
  });
  if (!res.ok) {
    throw new Error(`SFX generation failed: ${res.status} ${await res.text()}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(SFX_OUT, buf);
  console.log(`   ✅ ${(buf.length / 1024).toFixed(1)}KB → ${SFX_OUT}`);
}

function mixAudio() {
  mkdirSync("audio/app-full", { recursive: true });
  console.log(`🎙  Mixing TRACK-01 + SFX + NARR-INTRO (narrator dominant) → ${AUDIO_OUT}`);

  // 3-layer mix with AGGRESSIVE ducking — narrator stays clearly dominant:
  //   TRACK-01 (music)   — 0.15 base, ducks to 0.07 (-7dB) when narrator plays
  //   SFX-INTRO (wind)   — 0.50 base, ducks to 0.20 (-8dB) when narrator plays
  //   NARR-INTRO (voice) — 1.4 (boosted) so it sits clearly above
  // Music continues into the story (which also opens with TRACK-01) seamlessly.
  const cmd = [
    "ffmpeg -y",
    `-i ${MUSIC_TRACK}`,
    `-i ${SFX_OUT}`,
    `-i ${NARR_INTRO}`,
    `-filter_complex "`,
    // Music: starts at 0.15, ducks HARD to 0.07 while narrator (0.4s-4.66s) plays
    `[0:a]volume=0.15,adelay=0|0,afade=t=in:st=0:d=0.4,`,
    `volume='if(lt(t,0.4),1,if(lt(t,0.7),1-(t-0.4)/0.3*0.55,if(lt(t,4.66),0.45,if(lt(t,4.9),0.45+(t-4.66)/0.24*0.55,1))))':eval=frame[music];`,
    // SFX: starts at 0.50, ducks HARD to 0.20 once narration starts
    `[1:a]volume=0.50,adelay=0|0,afade=t=in:st=0:d=0.3,`,
    `volume='if(lt(t,0.4),1,if(lt(t,0.7),1-(t-0.4)/0.3*0.60,0.40))':eval=frame,`,
    `afade=t=out:st=4.6:d=0.3[sfx];`,
    // NARR: boosted to 1.4 so it sits clearly above music + SFX
    `[2:a]volume=1.4,adelay=400|400[narr];`,
    // Mix all three
    `[music][sfx][narr]amix=inputs=3:duration=first:dropout_transition=0:normalize=0[mixed];`,
    `[mixed]volume=1.8,acompressor=threshold=-18dB:ratio=3:attack=20:release=200[out]`,
    `" -map "[out]" -ac 2 -ar 48000 -b:a 192k -t ${VIDEO_DURATION_SEC} ${AUDIO_OUT}`,
  ].join(" ");

  execSync(cmd, { stdio: ["ignore", "ignore", "ignore"] });
  console.log(
    `   ✅ Done (${VIDEO_DURATION_SEC}s) — narrator boosted, music + SFX ducked under voice`,
  );
}

function overlayOnVideo() {
  console.log(`🎬 Overlaying audio onto 123start.mp4 + applying same enhancement as story...`);
  // Audio: loudnorm to broadcast standard + EQ + compressor + limiter + 192k AAC
  //   - matches the enhanced audio applied to Story-enhanced-louder.mp4
  //   - so the volume/character stays consistent at the cut between segments
  // Video: -c:v copy → byte-for-byte preserved, zero quality loss.
  const af = [
    "loudnorm=I=-14:TP=-1.5:LRA=11",
    "equalizer=f=200:t=q:w=1.0:g=1.5",
    "equalizer=f=3500:t=q:w=1.0:g=1.8",
    "acompressor=threshold=-22dB:ratio=2.5:attack=10:release=100:makeup=2",
    "alimiter=limit=0.95",
  ].join(",");

  const cmd = [
    "ffmpeg -y",
    `-i ${VIDEO_IN}`,
    `-i ${AUDIO_OUT}`,
    `-af "${af}"`,
    `-c:v copy`,
    `-c:a aac -b:a 192k -ar 48000 -ac 2`,
    `-map 0:v:0 -map 1:a:0`,
    `-movflags +faststart`,
    `-shortest`,
    VIDEO_OUT,
  ].join(" ");

  execSync(cmd, { stdio: ["ignore", "ignore", "ignore"] });
  console.log(`   ✅ Done → ${VIDEO_OUT}`);
}

async function main() {
  await generateSfx();
  mixAudio();
  overlayOnVideo();
  console.log(`\n✨ Complete!`);
  console.log(`   Output: ${VIDEO_OUT}`);
  console.log(`   Open:   open ${VIDEO_OUT}\n`);
}

main().catch((e) => {
  console.error("\n💥 Failed:", e);
  process.exit(1);
});
