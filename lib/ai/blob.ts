/**
 * Storage adapter — Vercel Blob in prod, in-memory pseudo-URLs in mock.
 */

import type { BlobAdapter, BlobUploadInput, BlobUploadOutput } from "./types";

export class MockBlobAdapter implements BlobAdapter {
  private store = new Map<string, ArrayBuffer | Buffer | string>();

  async put(input: BlobUploadInput): Promise<BlobUploadOutput> {
    this.store.set(input.pathname, input.body);
    const url = `https://mock.blob.local/${input.pathname}`;
    return { url };
  }

  /**
   * In mock mode we send the client back to OUR own /api/blob/upload PUT route
   * so an in-browser fetch can actually upload the bytes. (The real adapter
   * returns a Vercel Blob signed URL the client PUTs to directly.)
   */
  async createSignedUploadUrl(input: { pathname: string; contentType: string }) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const qs = `?pathname=${encodeURIComponent(input.pathname)}&contentType=${encodeURIComponent(input.contentType)}`;
    // Use a relative URL when called server-side (env unset) so the browser
    // resolves against its current origin.
    const url = `${base}/api/blob/upload${qs}`;
    return {
      url,
      publicUrl: `https://mock.blob.local/${input.pathname}`,
    };
  }

  async delete(url: string): Promise<void> {
    const pathname = url.replace("https://mock.blob.local/", "");
    this.store.delete(pathname);
  }
}

export class RealBlobAdapter implements BlobAdapter {
  constructor(private token: string) {
    if (!token) throw new Error("RealBlobAdapter: BLOB_READ_WRITE_TOKEN missing");
  }

  async put(input: BlobUploadInput): Promise<BlobUploadOutput> {
    const { put } = await import("@vercel/blob");
    const result = await put(input.pathname, input.body as Blob | ArrayBuffer, {
      access: "public",
      contentType: input.contentType,
      token: this.token,
    });
    return { url: result.url };
  }

  async createSignedUploadUrl(input: { pathname: string; contentType: string }) {
    // Vercel Blob uses client-direct upload via `handleUpload`. Return a
    // signed URL the client can PUT to using their SDK; we return a stable
    // public URL derived from the path.
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/blob/upload?pathname=${encodeURIComponent(input.pathname)}&contentType=${encodeURIComponent(input.contentType)}`;
    return { url, publicUrl: `https://blob.vercel-storage.com/${input.pathname}` };
  }

  async delete(url: string): Promise<void> {
    const { del } = await import("@vercel/blob");
    await del(url, { token: this.token });
  }
}
