import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/voice/consent/route";

describe("/api/voice/consent", () => {
  it("GET returns nonce + phrase for a name", async () => {
    const res = await GET(new Request("http://test/api/voice/consent?name=Grandma"));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { nonce: string; phrase: string; promptForUser: string };
    expect(j.nonce).toMatch(/^[A-Z0-9]{6}$/);
    expect(j.phrase).toContain("Grandma");
    expect(j.phrase).toContain(j.nonce);
  });

  it("GET 400 without name", async () => {
    const res = await GET(new Request("http://test/api/voice/consent"));
    expect(res.status).toBe(400);
  });

  it("POST creates clone when consent is valid", async () => {
    const draft = await (await GET(new Request("http://test/api/voice/consent?name=Maria"))).json();
    const d = draft as { nonce: string; phrase: string };
    const res = await POST(
      new Request("http://test/api/voice/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Maria",
          isSelfVoice: false,
          consentArtifactUrl: "https://x.test/c.webm",
          consentTranscript: d.phrase,
          consentNonce: d.nonce,
          voiceSampleUrl: "https://x.test/s.wav",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const j = (await res.json()) as { voiceClone: { elevenVoiceId: string } };
    expect(j.voiceClone.elevenVoiceId).toMatch(/^voice_mock_/);
  });

  it("POST 422 on consent denied", async () => {
    const res = await POST(
      new Request("http://test/api/voice/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "X",
          isSelfVoice: true,
          consentArtifactUrl: "https://x.test/c.webm",
          consentTranscript: "no nonce here",
          consentNonce: "AAAAAA",
          voiceSampleUrl: "https://x.test/s.wav",
        }),
      }),
    );
    expect(res.status).toBe(422);
  });

  it("POST 400 on missing fields", async () => {
    const res = await POST(
      new Request("http://test/api/voice/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });
});
