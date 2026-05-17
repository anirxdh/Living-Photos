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
    // Always return a relative URL so the browser PUTs to whatever origin it
    // loaded the page from. Using NEXT_PUBLIC_APP_URL here breaks when the
    // dev server runs on a port other than the one configured (e.g. 3001 vs
    // 3000), because the browser tries to reach the configured port and fails
    // with "Failed to fetch".
    const qs = `?pathname=${encodeURIComponent(input.pathname)}&contentType=${encodeURIComponent(input.contentType)}`;
    return {
      url: `/api/blob/upload${qs}`,
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
