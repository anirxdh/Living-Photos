/**
 * Lightweight route-handler tests — we import the handlers directly and
 * call them with a Request, like Vercel does. No HTTP server needed.
 */
import { describe, expect, it } from "vitest";
import { GET as healthHandler } from "@/app/api/health/route";
import { GET as getSceneHandler } from "@/app/api/scenes/[id]/route";
import { POST as createSceneHandler, GET as listScenesHandler } from "@/app/api/scenes/route";

function jsonReq(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/health", () => {
  it("returns ok with mockMode:true", async () => {
    const res = await healthHandler();
    const j = (await res.json()) as { status: string; mockMode: boolean };
    expect(j.status).toBe("ok");
    expect(j.mockMode).toBe(true);
  });
});

describe("/api/scenes", () => {
  it("POST creates a scene", async () => {
    const res = await createSceneHandler(
      jsonReq("http://test/api/scenes", {
        sourcePhotoUrl: "https://x.test/p.jpg",
        title: "Test",
      }),
    );
    expect(res.status).toBe(201);
    const j = (await res.json()) as { scene: { id: string; slug: string; title: string } };
    expect(j.scene.title).toBe("Test");
    expect(j.scene.slug).toMatch(/^[a-z0-9]{12}$/);
  });

  it("POST rejects invalid input with 400", async () => {
    const res = await createSceneHandler(
      jsonReq("http://test/api/scenes", { sourcePhotoUrl: "not a url" }),
    );
    expect(res.status).toBe(400);
  });

  it("GET without filter returns 400 (no unfiltered listings)", async () => {
    await createSceneHandler(
      jsonReq("http://test/api/scenes", { sourcePhotoUrl: "https://x.test/1.jpg" }),
    );
    const res = await listScenesHandler(new Request("http://test/api/scenes"));
    expect(res.status).toBe(400);
  });

  it("GET filters by email and returns public-safe shape (no anonymousEmail field)", async () => {
    await createSceneHandler(
      jsonReq("http://test/api/scenes", {
        sourcePhotoUrl: "https://x.test/p.jpg",
        title: "Alice's scene",
        anonymousEmail: "alice@x.test",
      }),
    );
    const res = await listScenesHandler(new Request("http://test/api/scenes?email=alice@x.test"));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { scenes: Array<{ title: string }> };
    expect(j.scenes).toHaveLength(1);
    expect(j.scenes[0].title).toBe("Alice's scene");
    // publicScene strips anonymousEmail so a slug-enumerator can't pull PII.
    expect((j.scenes[0] as unknown as Record<string, unknown>).anonymousEmail).toBeUndefined();
  });

  it("GET /api/scenes/[id] returns 404 for unknown", async () => {
    const res = await getSceneHandler(new Request("http://test/api/scenes/nope"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });

  it("GET /api/scenes/[id] returns the scene", async () => {
    const createRes = await createSceneHandler(
      jsonReq("http://test/api/scenes", { sourcePhotoUrl: "https://x.test/p.jpg" }),
    );
    const { scene } = (await createRes.json()) as { scene: { id: string } };
    const res = await getSceneHandler(new Request("http://test"), {
      params: Promise.resolve({ id: scene.id }),
    });
    expect(res.status).toBe(200);
  });
});
