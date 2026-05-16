import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/scenes/[id]/report/route";
import { memReports } from "@/lib/db/memory";
import { createScene } from "@/lib/scenes";

function jsonReq(body: unknown, ip = "10.0.0.1"): Request {
  return new Request("http://test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("/api/scenes/[id]/report", () => {
  it("accepts a report, persists it, and returns triage timestamp", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    const res = await POST(jsonReq({ reason: "depicts a real minor without consent" }), {
      params: Promise.resolve({ id: scene.id }),
    });
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      received: boolean;
      reportId: string;
      triageWithinIso: string;
    };
    expect(j.received).toBe(true);
    expect(j.reportId).toMatch(/^rpt_/);
    expect(new Date(j.triageWithinIso).getTime()).toBeGreaterThan(Date.now());
    expect(memReports.forScene(scene.id)).toHaveLength(1);
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

  it("rate-limits the 11th report from the same IP within an hour", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    const ip = "192.0.2.100";
    for (let i = 0; i < 10; i++) {
      const ok = await POST(jsonReq({ reason: `report ${i}` }, ip), {
        params: Promise.resolve({ id: scene.id }),
      });
      expect(ok.status).toBe(200);
    }
    const blocked = await POST(jsonReq({ reason: "one too many" }, ip), {
      params: Promise.resolve({ id: scene.id }),
    });
    expect(blocked.status).toBe(429);
  });

  it("doesn't overwrite scene.error anymore (reports are first-class rows)", async () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    await POST(jsonReq({ reason: "test report content" }), {
      params: Promise.resolve({ id: scene.id }),
    });
    const { memScenes } = await import("@/lib/db/memory");
    expect(memScenes.get(scene.id)?.error).toBeNull();
  });
});
