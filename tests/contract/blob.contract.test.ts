import { describe, expect, it } from "vitest";
import { MockBlobAdapter } from "@/lib/ai/blob";

describe("BlobAdapter contract: MockBlobAdapter", () => {
  const adapter = new MockBlobAdapter();

  it("put() returns a mock blob URL", async () => {
    const out = await adapter.put({
      pathname: "uploads/test.jpg",
      body: "hello",
      contentType: "image/jpeg",
    });
    expect(out.url).toContain("mock.blob.local");
    expect(out.url).toContain("uploads/test.jpg");
  });

  it("createSignedUploadUrl returns { url, publicUrl }", async () => {
    const out = await adapter.createSignedUploadUrl({
      pathname: "uploads/abc.jpg",
      contentType: "image/jpeg",
    });
    expect(out.url).toContain("/api/blob/upload");
    expect(out.url).toContain("uploads%2Fabc.jpg");
    expect(out.publicUrl).toContain("uploads/abc.jpg");
  });

  it("delete() resolves quietly for unknown URLs", async () => {
    await expect(adapter.delete("https://mock.blob.local/does-not-exist")).resolves.toBeUndefined();
  });
});
