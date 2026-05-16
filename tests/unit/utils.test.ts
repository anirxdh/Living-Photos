import { describe, expect, it } from "vitest";
import { cn, mockId, newId } from "@/lib/utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges class names and dedupes Tailwind conflicts", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
      expect(cn("text-foreground", false && "hidden", "bg-muted")).toContain("bg-muted");
    });
  });

  describe("newId", () => {
    it("generates prefixed 12-char ids", () => {
      const id = newId("scn");
      expect(id).toMatch(/^scn_[0-9a-z]{12}$/);
    });

    it("never collides across 1000 invocations", () => {
      const seen = new Set<string>();
      for (let i = 0; i < 1000; i++) seen.add(newId("x"));
      expect(seen.size).toBe(1000);
    });
  });

  describe("mockId", () => {
    it("is deterministic for the same seed", () => {
      expect(mockId("voice", "anirudh")).toBe(mockId("voice", "anirudh"));
    });

    it("differs for different seeds", () => {
      expect(mockId("voice", "a")).not.toBe(mockId("voice", "b"));
    });

    it("encodes prefix", () => {
      expect(mockId("voice", "x")).toMatch(/^voice_mock_[0-9a-z]+$/);
    });
  });
});
