import { describe, expect, it } from "vitest";
import { GET, PUT } from "@/app/api/blob/upload/route";

describe("/api/blob/upload", () => {
  it("GET returns signed url and publicUrl", async () => {
    const res = await GET(
      new Request("http://test/api/blob/upload?pathname=uploads/a.jpg&contentType=image/jpeg"),
    );
    const j = (await res.json()) as { url: string; publicUrl: string };
    expect(j.url).toContain("/api/blob/upload");
    expect(j.publicUrl).toContain("uploads/a.jpg");
  });

  it("GET 400 without pathname", async () => {
    const res = await GET(new Request("http://test/api/blob/upload"));
    expect(res.status).toBe(400);
  });

  it("PUT stores bytes in mock blob", async () => {
    const body = "hello";
    const res = await PUT(
      new Request("http://test/api/blob/upload?pathname=uploads/b.jpg", {
        method: "PUT",
        body,
        headers: { "content-type": "image/jpeg", "content-length": String(body.length) },
      }),
    );
    const j = (await res.json()) as { url: string };
    expect(j.url).toContain("uploads/b.jpg");
  });

  it("PUT 400 without pathname", async () => {
    const res = await PUT(
      new Request("http://test/api/blob/upload", {
        method: "PUT",
        body: "x",
        headers: { "content-type": "image/jpeg", "content-length": "1" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("PUT 400 rejects disallowed pathname prefix", async () => {
    const res = await PUT(
      new Request("http://test/api/blob/upload?pathname=phish/login.html", {
        method: "PUT",
        body: "x",
        headers: { "content-type": "image/jpeg", "content-length": "1" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("PUT 400 rejects disallowed content-type", async () => {
    const res = await PUT(
      new Request("http://test/api/blob/upload?pathname=uploads/x.html", {
        method: "PUT",
        body: "<html></html>",
        headers: { "content-type": "text/html", "content-length": "13" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("PUT 411 when content-length is missing", async () => {
    const res = await PUT(
      new Request("http://test/api/blob/upload?pathname=uploads/y.jpg", {
        method: "PUT",
        body: "x",
        headers: { "content-type": "image/jpeg" },
      }),
    );
    expect(res.status).toBe(411);
  });
});
