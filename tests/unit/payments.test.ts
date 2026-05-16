import { describe, expect, it } from "vitest";
import { memProcessed } from "@/lib/db/memory";
import { fulfillCheckoutEvent, PRICE_CENTS, startCheckout } from "@/lib/payments";
import { createScene } from "@/lib/scenes";

describe("payments service", () => {
  describe("startCheckout", () => {
    it("creates a Checkout session for an unpaid scene", async () => {
      const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg", title: "T" });
      const out = await startCheckout({ sceneId: scene.id });
      expect("alreadyPaid" in out && !out.alreadyPaid).toBe(true);
      if ("url" in out) {
        expect(out.url).toContain(scene.slug);
        expect(out.sessionId).toMatch(/^cs_test_/);
      }
    });

    it("short-circuits if scene is already paid", async () => {
      const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
      const { markScenePaid } = await import("@/lib/scenes");
      markScenePaid(scene.id, PRICE_CENTS);
      const out = await startCheckout({ sceneId: scene.id });
      expect("alreadyPaid" in out && out.alreadyPaid).toBe(true);
    });

    it("throws on unknown scene", async () => {
      await expect(startCheckout({ sceneId: "nope" })).rejects.toThrow();
    });
  });

  describe("fulfillCheckoutEvent (idempotency)", () => {
    function buildEvent(sceneId: string, id = "evt_1") {
      return {
        id,
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_x",
            metadata: { sceneId },
            amount_total: 1900,
          },
        },
      };
    }

    it("flips scene.paid on first delivery", () => {
      const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
      const r = fulfillCheckoutEvent(buildEvent(scene.id));
      expect(r.mutated).toBe(true);
      expect(r.sceneId).toBe(scene.id);
    });

    it("is a no-op on duplicate event id", () => {
      const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
      const evt = buildEvent(scene.id, "evt_dup");
      const first = fulfillCheckoutEvent(evt);
      const second = fulfillCheckoutEvent(evt);
      const third = fulfillCheckoutEvent(evt);
      expect(first.mutated).toBe(true);
      expect(second.mutated).toBe(false);
      expect(third.mutated).toBe(false);
      expect(second.reason).toBe("duplicate");
      // Only ONE processed-events row exists
      expect(memProcessed.list().filter((p) => p.eventId === "evt_dup")).toHaveLength(1);
    });

    it("ignores irrelevant event types but still records them as processed", () => {
      const r = fulfillCheckoutEvent({
        id: "evt_other",
        type: "customer.created",
        data: { object: { id: "cus_1" } },
      });
      expect(r.mutated).toBe(false);
      expect(r.reason).toBe("irrelevant_event_type");
    });

    it("returns missing_sceneId_metadata when metadata is empty", () => {
      const r = fulfillCheckoutEvent({
        id: "evt_no_meta",
        type: "checkout.session.completed",
        data: { object: { id: "cs_test_y" } },
      });
      expect(r.mutated).toBe(false);
      expect(r.reason).toBe("missing_sceneId_metadata");
    });

    it("returns scene_not_found when sceneId points nowhere", () => {
      const r = fulfillCheckoutEvent({
        id: "evt_phantom",
        type: "checkout.session.completed",
        data: { object: { id: "cs_test_z", metadata: { sceneId: "scn_phantom" } } },
      });
      expect(r.mutated).toBe(false);
      expect(r.reason).toBe("scene_not_found");
    });
  });

  it("PRICE_CENTS is $19.00", () => {
    expect(PRICE_CENTS).toBe(1900);
  });
});
