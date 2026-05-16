import { beforeEach, describe, expect, it } from "vitest";
import { clearSentEmails, getSentEmails } from "@/lib/email";
import { fulfillCheckoutEvent } from "@/lib/payments";
import { createScene } from "@/lib/scenes";

describe("payment fulfillment → email side effect", () => {
  beforeEach(() => clearSentEmails());

  it("sends a 'memory ready' email when customer_email is on the event", async () => {
    const scene = createScene({
      sourcePhotoUrl: "https://x.test/p.jpg",
      title: "Mom's kitchen",
    });
    fulfillCheckoutEvent({
      id: "evt_email_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_x",
          metadata: { sceneId: scene.id },
          amount_total: 1900,
          customer_email: "mom@x.test",
        },
      },
    });
    // sendEmail is fire-and-forget; resolve microtask queue
    await new Promise((r) => setImmediate(r));
    const emails = getSentEmails();
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe("mom@x.test");
    expect(emails[0].subject).toContain("Mom's kitchen");
  });

  it("falls back to scene.anonymousEmail when checkout has no customer_email", async () => {
    const scene = createScene({
      sourcePhotoUrl: "https://x.test/p.jpg",
      anonymousEmail: "alice@x.test",
      title: "Garden",
    });
    fulfillCheckoutEvent({
      id: "evt_email_2",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_y", metadata: { sceneId: scene.id }, amount_total: 1900 } },
    });
    await new Promise((r) => setImmediate(r));
    expect(getSentEmails().map((e) => e.to)).toContain("alice@x.test");
  });

  it("does NOT send an email when neither source has an address", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    fulfillCheckoutEvent({
      id: "evt_email_3",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_z", metadata: { sceneId: scene.id }, amount_total: 1900 } },
    });
    await new Promise((r) => setImmediate(r));
    expect(getSentEmails()).toHaveLength(0);
  });
});
