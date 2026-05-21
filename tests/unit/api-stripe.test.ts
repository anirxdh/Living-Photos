import { describe, expect, it } from "vitest";
import { POST as checkoutHandler } from "@/app/api/stripe/checkout/route";
import { POST as mockFulfillHandler } from "@/app/api/stripe/mock-fulfill/route";
import { POST as webhookHandler } from "@/app/api/webhooks/stripe/route";
import { signMockWebhook } from "@/lib/ai/stripe";
import { createScene, getScene } from "@/lib/scenes";

function jsonReq(body: unknown): Request {
  return new Request("http://test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/stripe/checkout", () => {
  it("creates a checkout session URL for an unpaid scene", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg", title: "x" });
    const res = await checkoutHandler(jsonReq({ sceneId: scene.id }));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { url?: string; alreadyPaid?: boolean };
    expect(j.url).toContain("scene_id=");
    expect(j.alreadyPaid).toBeFalsy();
  });

  it("400 on bad input", async () => {
    const res = await checkoutHandler(jsonReq({}));
    expect(res.status).toBe(400);
  });
});

describe("/api/webhooks/stripe", () => {
  it("verifies signature and fulfills the scene", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    const body = JSON.stringify({
      id: "evt_e2e_1",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_1", metadata: { sceneId: scene.id }, amount_total: 1900 } },
    });
    const sig = signMockWebhook(body);
    const res = await webhookHandler(
      new Request("http://test/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": sig, "content-type": "application/json" },
        body,
      }),
    );
    expect(res.status).toBe(200);
    expect(getScene(scene.id)?.paid).toBe(true);
  });

  it("rejects bad signature with 400", async () => {
    const res = await webhookHandler(
      new Request("http://test/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "t=1,v1=deadbeef", "content-type": "application/json" },
        body: JSON.stringify({ id: "x", type: "y", data: { object: { id: "x" } } }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("is idempotent across 3 replays", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    const body = JSON.stringify({
      id: "evt_replay",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_x", metadata: { sceneId: scene.id }, amount_total: 1900 } },
    });
    const sig = signMockWebhook(body);
    const req = () =>
      new Request("http://test/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": sig, "content-type": "application/json" },
        body,
      });
    const a = await webhookHandler(req());
    const b = await webhookHandler(req());
    const c = await webhookHandler(req());
    const ja = (await a.json()) as { mutated: boolean };
    const jb = (await b.json()) as { mutated: boolean };
    const jc = (await c.json()) as { mutated: boolean };
    expect([ja.mutated, jb.mutated, jc.mutated]).toEqual([true, false, false]);
  });
});

describe("/api/stripe/mock-fulfill", () => {
  it("simulates a webhook fulfillment in mock mode", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    const res = await mockFulfillHandler(
      jsonReq({ sceneId: scene.id, sessionId: "cs_test_session" }),
    );
    expect(res.status).toBe(200);
    expect(getScene(scene.id)?.paid).toBe(true);
  });
});
