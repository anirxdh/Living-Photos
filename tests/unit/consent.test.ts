import { describe, expect, it } from "vitest";
import {
  buildConsentDraft,
  ConsentError,
  createConsentedVoiceClone,
  incrementRegen,
  isDenylistedName,
  REGEN_CAP,
  revokeVoiceClone,
} from "@/lib/voice/consent";

describe("voice consent gate", () => {
  describe("buildConsentDraft", () => {
    it("includes name and nonce in the phrase", () => {
      const draft = buildConsentDraft("Sarah");
      expect(draft.phrase).toContain("Sarah");
      expect(draft.phrase).toContain(draft.nonce);
      expect(draft.nonce).toMatch(/^[A-Z0-9]{6}$/);
    });

    it("issues a fresh nonce every call", () => {
      const a = buildConsentDraft("a");
      const b = buildConsentDraft("a");
      expect(a.nonce).not.toBe(b.nonce);
    });
  });

  describe("isDenylistedName", () => {
    it("blocks public figures", () => {
      expect(isDenylistedName("Donald Trump")).toBe(true);
      expect(isDenylistedName("ELON MUSK")).toBe(true);
      expect(isDenylistedName("Taylor Swift")).toBe(true);
    });
    it("allows ordinary names", () => {
      expect(isDenylistedName("Anirudh Vasudevan")).toBe(false);
      expect(isDenylistedName("Grandma")).toBe(false);
    });
  });

  describe("createConsentedVoiceClone", () => {
    it("creates a clone when consent is valid", async () => {
      const draft = buildConsentDraft("Maria");
      const clone = await createConsentedVoiceClone({
        name: "Maria",
        isSelfVoice: false,
        consentArtifactUrl: "https://x.test/consent.webm",
        consentTranscript: draft.phrase,
        consentNonce: draft.nonce,
        voiceSampleUrl: "https://x.test/sample.wav",
      });
      expect(clone.elevenVoiceId).toMatch(/^voice_mock_/);
      expect(clone.consentVerifiedAt).toBeInstanceOf(Date);
      expect(clone.name).toBe("Maria");
    });

    it("rejects when nonce missing from transcript", async () => {
      await expect(
        createConsentedVoiceClone({
          name: "Maria",
          isSelfVoice: false,
          consentArtifactUrl: "https://x.test/consent.webm",
          consentTranscript: "I agree, definitely.",
          consentNonce: "ABC123",
          voiceSampleUrl: "https://x.test/sample.wav",
        }),
      ).rejects.toBeInstanceOf(ConsentError);
    });

    it("rejects when name missing from transcript", async () => {
      const draft = buildConsentDraft("Maria");
      await expect(
        createConsentedVoiceClone({
          name: "Maria",
          isSelfVoice: false,
          consentArtifactUrl: "https://x.test/consent.webm",
          consentTranscript: `Code is ${draft.nonce} and I give consent.`,
          consentNonce: draft.nonce,
          voiceSampleUrl: "https://x.test/sample.wav",
        }),
      ).rejects.toBeInstanceOf(ConsentError);
    });

    it("rejects denylisted names", async () => {
      const draft = buildConsentDraft("Donald Trump");
      await expect(
        createConsentedVoiceClone({
          name: "Donald Trump",
          isSelfVoice: false,
          consentArtifactUrl: "https://x.test/consent.webm",
          consentTranscript: draft.phrase,
          consentNonce: draft.nonce,
          voiceSampleUrl: "https://x.test/sample.wav",
        }),
      ).rejects.toBeInstanceOf(ConsentError);
    });
  });

  describe("revokeVoiceClone", () => {
    it("clears the elevenVoiceId and sets revokedAt", async () => {
      const draft = buildConsentDraft("X");
      const clone = await createConsentedVoiceClone({
        name: "X",
        isSelfVoice: true,
        consentArtifactUrl: "https://x.test/c.webm",
        consentTranscript: draft.phrase,
        consentNonce: draft.nonce,
        voiceSampleUrl: "https://x.test/s.wav",
      });
      await revokeVoiceClone(clone.id);
      // Re-read via memVoiceClones — re-import to avoid stale closure
      const { memVoiceClones } = await import("@/lib/db/memory");
      const after = memVoiceClones.get(clone.id);
      expect(after?.revokedAt).toBeInstanceOf(Date);
      expect(after?.elevenVoiceId).toBeNull();
    });
  });

  describe("incrementRegen", () => {
    it("allows up to REGEN_CAP regenerations then refuses", async () => {
      const draft = buildConsentDraft("X");
      const clone = await createConsentedVoiceClone({
        name: "X",
        isSelfVoice: true,
        consentArtifactUrl: "https://x.test/c.webm",
        consentTranscript: draft.phrase,
        consentNonce: draft.nonce,
        voiceSampleUrl: "https://x.test/s.wav",
      });
      for (let i = 0; i < REGEN_CAP; i++) {
        const r = incrementRegen(clone.id);
        expect(r.ok).toBe(true);
      }
      const r = incrementRegen(clone.id);
      expect(r.ok).toBe(false);
      expect(r.count).toBe(REGEN_CAP);
    });

    it("returns ok=false for unknown clone id", () => {
      expect(incrementRegen("does-not-exist")).toEqual({ ok: false, count: 0 });
    });
  });
});
