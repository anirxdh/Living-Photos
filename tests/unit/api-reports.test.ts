import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/scenes/[id]/report/route";
import { createScene } from "@/lib/scenes";

function jsonReq(body: unknown): Request {
  return new Request("http://test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/scenes/[id]/report", () => {
  it("accepts a report and returns autoNuke timestamp", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    const res = await POST(jsonReq({ reason: "depicts a real minor without consent" }), {
      params: Promise.resolve({ id: scene.id }),
    });
    expect(res.status).toBe(200);
    const j = (await res.json()) as { received: boolean; autoNukeAtIso: string };
    expect(j.received).toBe(true);
    expect(new Date(j.autoNukeAtIso).getTime()).toBeGreaterThan(Date.now());
  });

  it("404s for unknown scene", async () => {
    const res = await POST(jsonReq({ reason: "abc 12345" }), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });

  it("400 on too-short reason", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    const res = await POST(jsonReq({ reason: "x" }), {
      params: Promise.resolve({ id: scene.id }),
    });
    expect(res.status).toBe(400);
  });
});
