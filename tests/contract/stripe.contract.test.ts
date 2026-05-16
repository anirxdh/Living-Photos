import { describe, expect, it } from "vitest";
import { MOCK_WEBHOOK_SECRET, MockStripeAdapter, signMockWebhook } from "@/lib/ai/stripe";

describe("StripeAdapter contract: MockStripeAdapter", () => {
  const adapter = new MockStripeAdapter();

  it("createCheckoutSession returns { sessionId, url }", async () => {
    const out = await adapter.createCheckoutSession({
      sceneId: "scn_x",
      amountCents: 1900,
      currency: "usd",
      successUrl: "http://localhost:3000/scene/scn_x/success",
      cancelUrl: "http://localhost:3000/scene/scn_x",
      productName: "Living Photo — Mom's kitchen",
    });
    expect(out.sessionId).toMatch(/^cs_test_/);
    expect(out.url).toContain("success");
    expect(out.url).toContain("scn_x");
  });

  it("verifyAndParseWebhook accepts a correctly signed body", () => {
    const body = JSON.stringify({
      id: "evt_test_1",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_x", metadata: { sceneId: "scn_x" } } },
    });
    const sig = signMockWebhook(body);
    const evt = adapter.verifyAndParseWebhook({ rawBody: body, signature: sig });
    expect(evt.id).toBe("evt_test_1");
    expect(evt.type).toBe("checkout.session.completed");
    expect(evt.data.object.metadata?.sceneId).toBe("scn_x");
  });

  it("verifyAndParseWebhook rejects a body with a wrong signature", () => {
    const body = JSON.stringify({ id: "evt_x", type: "x", data: { object: { id: "x" } } });
    expect(() =>
      adapter.verifyAndParseWebhook({ rawBody: body, signature: "t=1,v1=deadbeef" }),
    ).toThrow();
  });

  it("verifyAndParseWebhook rejects a body that was tampered with after signing", () => {
    const original = JSON.stringify({ id: "evt_1", type: "x", data: { object: { id: "x" } } });
    const sig = signMockWebhook(original);
    const tampered = original.replace("evt_1", "evt_2");
    expect(() => adapter.verifyAndParseWebhook({ rawBody: tampered, signature: sig })).toThrow();
  });

  it("MOCK_WEBHOOK_SECRET is the documented secret used by signMockWebhook", () => {
    expect(MOCK_WEBHOOK_SECRET).toBe("whsec_mock_secret");
  });
});
