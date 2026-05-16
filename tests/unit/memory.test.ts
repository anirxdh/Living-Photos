import { describe, expect, it } from "vitest";
import {
  memPayments,
  memProcessed,
  memScenes,
  memVoiceClones,
  resetMemoryStore,
} from "@/lib/db/memory";

describe("in-memory DB", () => {
  describe("scenes", () => {
    it("inserts and retrieves a scene", () => {
      const scene = memScenes.insert({
        id: "scn_1",
        slug: "abc",
        sourcePhotoUrl: "https://x.test/1.jpg",
        title: "Mom's kitchen",
      });
      expect(scene.title).toBe("Mom's kitchen");
      expect(memScenes.get("scn_1")?.slug).toBe("abc");
    });

    it("finds by slug", () => {
      memScenes.insert({
        id: "scn_2",
        slug: "bedroom-1995",
        sourcePhotoUrl: "https://x.test/2.jpg",
      });
      expect(memScenes.getBySlug("bedroom-1995")?.id).toBe("scn_2");
    });

    it("updates a scene patch", () => {
      memScenes.insert({ id: "scn_3", slug: "c", sourcePhotoUrl: "https://x.test/3.jpg" });
      const updated = memScenes.update("scn_3", { paid: true, status: "ready" });
      expect(updated?.paid).toBe(true);
      expect(updated?.status).toBe("ready");
    });

    it("returns null when updating an unknown scene", () => {
      expect(memScenes.update("does-not-exist", { paid: true })).toBeNull();
    });
  });

  describe("voiceClones", () => {
    it("stores a consent-verified clone", () => {
      memVoiceClones.insert({
        id: "vc_1",
        userId: null,
        sceneId: null,
        elevenVoiceId: "el_voice_x",
        name: "Grandma",
        consentArtifactUrl: "https://x.test/consent.webm",
        consentTranscript: "I, Sarah, give consent...",
        consentNonce: "n_1",
        consentVerifiedAt: new Date(),
        isSelfVoice: false,
        regenerationCount: 0,
        revokedAt: null,
        createdAt: new Date(),
      });
      expect(memVoiceClones.get("vc_1")?.elevenVoiceId).toBe("el_voice_x");
    });
  });

  describe("payments", () => {
    it("stores a payment row", () => {
      memPayments.insert({
        id: "pay_1",
        sceneId: "scn_1",
        stripeCheckoutSessionId: "cs_test_abc",
        stripePaymentIntentId: null,
        amountCents: 1900,
        currency: "usd",
        email: "a@x.test",
        status: "pending",
        createdAt: new Date(),
        completedAt: null,
      });
      expect(memPayments.list()).toHaveLength(1);
    });
  });

  describe("processed webhook events (idempotency)", () => {
    it("returns true the first time and false on retry", () => {
      const evt = {
        id: "evt_local_1",
        provider: "stripe",
        eventId: "evt_remote_1",
        eventType: "checkout.session.completed",
        payload: null,
        processedAt: new Date(),
      };
      expect(memProcessed.markProcessed(evt)).toBe(true);
      expect(memProcessed.markProcessed(evt)).toBe(false);
      expect(memProcessed.has("stripe", "evt_remote_1")).toBe(true);
    });

    it("treats different providers as separate keyspaces", () => {
      const base = {
        id: "evt_x",
        eventId: "evt_remote_2",
        eventType: "anything",
        payload: null,
        processedAt: new Date(),
      };
      expect(memProcessed.markProcessed({ ...base, provider: "stripe" })).toBe(true);
      expect(memProcessed.markProcessed({ ...base, provider: "elevenlabs" })).toBe(true);
    });
  });

  describe("resetMemoryStore", () => {
    it("clears every collection", () => {
      memScenes.insert({ id: "scn_x", slug: "x", sourcePhotoUrl: "https://x.test/x.jpg" });
      resetMemoryStore();
      expect(memScenes.list()).toHaveLength(0);
    });
  });
});
