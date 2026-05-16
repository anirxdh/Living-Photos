import { describe, expect, it } from "vitest";
import type { VoiceAdapter } from "@/lib/ai/types";
import { MockVoiceAdapter, RealVoiceAdapter } from "@/lib/ai/voice";

const implementations: Array<{ name: string; build: () => VoiceAdapter | null }> = [
  { name: "MockVoiceAdapter", build: () => new MockVoiceAdapter() },
  {
    name: "RealVoiceAdapter",
    build: () =>
      process.env.ELEVENLABS_API_KEY ? new RealVoiceAdapter(process.env.ELEVENLABS_API_KEY) : null,
  },
];

for (const { name, build } of implementations) {
  describe(`VoiceAdapter contract: ${name}`, () => {
    const adapter = build();
    if (!adapter) {
      it.skip(`${name} skipped — set ELEVENLABS_API_KEY to enable`, () => {});
      return;
    }

    it("cloneVoice() returns { voiceId, costCents }", async () => {
      const out = await adapter.cloneVoice({
        sampleUrl: "https://example.test/sample.wav",
        name: `test_${name}`,
        description: "Contract test",
      });
      expect(out.voiceId).toBeTypeOf("string");
      expect(out.voiceId.length).toBeGreaterThan(0);
      expect(out.costCents).toBeTypeOf("number");
    });

    it("generateNarration() returns { url, durationSeconds, costCents }", async () => {
      // Only run TTS against mock — real TTS costs real money in CI.
      if (name !== "MockVoiceAdapter") return;
      const out = await adapter.generateNarration({
        voiceId: "voice_x",
        text: "Hello sweetheart, you're home.",
      });
      expect(out.url).toBeTypeOf("string");
      expect(out.durationSeconds).toBeGreaterThan(0);
      expect(out.costCents).toBeGreaterThanOrEqual(0);
    });

    it("deleteVoice() resolves without throwing", async () => {
      if (name !== "MockVoiceAdapter") return;
      await expect(adapter.deleteVoice("voice_does_not_exist")).resolves.toBeUndefined();
    });
  });
}
