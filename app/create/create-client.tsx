"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const ACCEPT = { "image/jpeg": [], "image/png": [], "image/webp": [] };
const MAX_BYTES = 25 * 1024 * 1024;

type UploadState = "idle" | "uploading" | "saving" | "error";

export default function CreateClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      setError(null);
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      setPreview(URL.createObjectURL(f));
      if (!title) {
        setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
      }
    },
    [title],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_BYTES,
    multiple: false,
  });

  async function submit() {
    if (!file) {
      setError("Pick a photo first.");
      return;
    }
    setError(null);
    setState("uploading");
    try {
      // 1. Get signed upload URL.
      const pathname = `uploads/${Date.now()}-${slug(file.name)}`;
      const signedRes = await fetch(
        `/api/blob/upload?pathname=${encodeURIComponent(pathname)}&contentType=${encodeURIComponent(file.type)}`,
      );
      if (!signedRes.ok) throw new Error("could not get signed URL");
      const { url, publicUrl } = (await signedRes.json()) as {
        url: string;
        publicUrl: string;
      };

      // 2. PUT the bytes.
      const putRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type },
      });
      if (!putRes.ok) throw new Error("upload failed");
      const putJson = (await putRes.json().catch(() => ({}))) as { url?: string };

      // 3. Create scene + kick pipeline.
      setState("saving");
      const sourceUrl = putJson.url ?? publicUrl;
      const sceneRes = await fetch("/api/scenes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourcePhotoUrl: sourceUrl,
          title: title || "Untitled memory",
          description: description || undefined,
        }),
      });
      if (!sceneRes.ok) throw new Error("could not create scene");
      const { scene } = (await sceneRes.json()) as { scene: { id: string; slug: string } };
      router.push(`/scene/${scene.slug}`);
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "upload failed");
    }
  }

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition cursor-pointer ${
          isDragActive ? "border-foreground bg-muted" : "border-border hover:border-foreground"
        }`}
        data-testid="dropzone"
      >
        <input {...getInputProps()} data-testid="file-input" />
        {preview ? (
          // biome-ignore lint/performance/noImgElement: blob preview, not optimized
          <img src={preview} alt="preview" className="mx-auto max-h-64 rounded-lg" />
        ) : (
          <div>
            <p className="text-lg">
              {isDragActive ? "Drop the photo here." : "Drag a photo here, or click to browse."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              JPG, PNG, or WEBP, up to 25 MB. Interior scenes work best.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm text-muted-foreground">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grandma's kitchen, 1995"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            data-testid="title-input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted-foreground">A note (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you remember about this place?"
            rows={3}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            data-testid="description-input"
          />
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!file || state === "uploading" || state === "saving"}
        className="w-full rounded-full bg-foreground py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-40"
        data-testid="submit-button"
      >
        {state === "uploading"
          ? "Uploading…"
          : state === "saving"
            ? "Preparing your memory…"
            : "Bring this memory to life"}
      </button>
    </div>
  );
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .slice(0, 60);
}
