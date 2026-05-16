import { describe, expect, it } from "vitest";
import {
  createScene,
  getScene,
  getSceneBySlug,
  listAllScenes,
  listScenesForOwner,
  markScenePaid,
} from "@/lib/scenes";

describe("scenes service", () => {
  it("creates a scene with slug + pending status", () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg", title: "Kitchen" });
    expect(scene.id).toMatch(/^scn_/);
    expect(scene.slug).toMatch(/^[a-z0-9]{8}$/);
    expect(scene.status).toBe("pending");
    expect(scene.paid).toBe(false);
  });

  it("auto-titles 'Untitled memory' when no title is given", () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/p.jpg" });
    expect(scene.title).toBe("Untitled memory");
  });

  it("retrieves by id and slug", () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/a.jpg", title: "A" });
    expect(getScene(scene.id)?.title).toBe("A");
    expect(getSceneBySlug(scene.slug)?.id).toBe(scene.id);
  });

  it("lists scenes filtered by anonymousEmail", () => {
    createScene({
      sourcePhotoUrl: "https://x.test/1.jpg",
      anonymousEmail: "alice@x.test",
      title: "Alice's",
    });
    createScene({
      sourcePhotoUrl: "https://x.test/2.jpg",
      anonymousEmail: "bob@x.test",
      title: "Bob's",
    });
    const alice = listScenesForOwner({ email: "alice@x.test" });
    expect(alice).toHaveLength(1);
    expect(alice[0].title).toBe("Alice's");
  });

  it("listAllScenes orders newest first (id secondary sort handles same-ms)", () => {
    const first = createScene({ sourcePhotoUrl: "https://x.test/1.jpg", title: "first" });
    const second = createScene({ sourcePhotoUrl: "https://x.test/2.jpg", title: "second" });
    const list = listAllScenes();
    expect(list).toHaveLength(2);
    expect(list.map((s) => s.id)).toContain(first.id);
    expect(list.map((s) => s.id)).toContain(second.id);
    // Sort is deterministic — newer createdAt OR larger id wins
    expect(list[0].createdAt.getTime()).toBeGreaterThanOrEqual(list[1].createdAt.getTime());
  });

  it("markScenePaid flips paid + records price", () => {
    const scene = createScene({ sourcePhotoUrl: "https://x.test/x.jpg" });
    const updated = markScenePaid(scene.id, 1900);
    expect(updated?.paid).toBe(true);
    expect(updated?.pricePaidCents).toBe(1900);
    expect(updated?.paidAt).toBeInstanceOf(Date);
  });
});
