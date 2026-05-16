import { describe, expect, it } from "vitest";
import { GET, PUT } from "@/app/api/blob/upload/route";

describe("/api/blob/upload", () => {
  it("GET returns signed url and publicUrl", async () => {
    const res = await GET(
      new Request("http://test/api/blob/upload?pathname=uploads/a.jpg&contentType=image/jpeg"),
    );
    const j = (await res.json()) as { url: string; publicUrl: string };
    expect(j.url).toContain("upload");
    expect(j.publicUrl).toContain("uploads/a.jpg");
  });

  it("GET 400 without pathname", async () => {
    const res = await GET(new Request("http://test/api/blob/upload"));
    expect(res.status).toBe(400);
  });

  it("PUT stores bytes in mock blob", async () => {
    const res = await PUT(
      new Request("http://test/api/blob/upload?pathname=uploads/b.jpg", {
        method: "PUT",
        body: "hello",
        headers: { "content-type": "image/jpeg" },
      }),
    );
    const j = (await res.json()) as { url: string };
    expect(j.url).toContain("uploads/b.jpg");
  });

  it("PUT 400 without pathname", async () => {
    const res = await PUT(new Request("http://test/api/blob/upload", { method: "PUT", body: "x" }));
    expect(res.status).toBe(400);
  });
});
