import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/voice/narrate/route";
import { buildConsentDraft, createConsentedVoiceClone, REGEN_CAP } from "@/lib/voice/consent";

function jsonReq(body: unknown): Request {
  return new Request("http://test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function makeClone() {
  const draft = buildConsentDraft("Maria");
  return createConsentedVoiceClone({
    name: "Maria",
    isSelfVoice: true,
    consentArtifactUrl: "https://x.test/consent.webm",
    consentTranscript: draft.phrase,
    consentNonce: draft.nonce,
    voiceSampleUrl: "https://x.test/sample.wav",
  });
}

describe("/api/voice/narrate (Memory Letter)", () => {
  it("returns narration mp3 for a verified clone", async () => {
    const clone = await makeClone();
    const res = await POST(jsonReq({ voiceCloneId: clone.id, text: "Happy birthday sweetheart." }));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { narration: { url: string; costCents: number } };
    expect(j.narration.url).toMatch(/\.mp3$/);
    expect(j.narration.costCents).toBeGreaterThan(0);
  });

  it("404 for unknown voice clone", async () => {
    const res = await POST(jsonReq({ voiceCloneId: "nope", text: "x" }));
    expect(res.status).toBe(404);
  });

  it("400 on bad input", async () => {
    const res = await POST(jsonReq({}));
    expect(res.status).toBe(400);
  });

  it("429 once regeneration cap is reached", async () => {
    const clone = await makeClone();
    for (let i = 0; i < REGEN_CAP; i++) {
      const ok = await POST(jsonReq({ voiceCloneId: clone.id, text: `take ${i}` }));
      expect(ok.status).toBe(200);
    }
    const blocked = await POST(jsonReq({ voiceCloneId: clone.id, text: "overflow" }));
    expect(blocked.status).toBe(429);
  });
});
