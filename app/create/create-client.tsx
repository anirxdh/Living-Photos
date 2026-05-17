"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

const ACCEPT = { "image/jpeg": [], "image/png": [], "image/webp": [] };
const MAX_BYTES = 25 * 1024 * 1024;
const VOICE_KEY = "livingphotos.voice";

type UploadState = "idle" | "uploading" | "saving" | "error";
interface SavedVoice {
  id: string;
  name: string;
  savedAt: number;
}

export default function CreateClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState<SavedVoice | null>(null);

  // Load a previously-cloned voice from localStorage (set on the /voice page
  // when the consent flow succeeds). The voice clone is tied to the user's
  // browser; if it's there, we automatically narrate the scene with it.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VOICE_KEY);
      if (raw) setVoice(JSON.parse(raw) as SavedVoice);
    } catch {
      // localStorage blocked — fine, just no prefill
    }
  }, []);

  function clearVoice() {
    setVoice(null);
    try {
      localStorage.removeItem(VOICE_KEY);
    } catch {
      // non-fatal
    }
  }

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
      const pathname = `uploads/${Date.now()}-${slug(file.name)}`;
      const signedRes = await fetch(
        `/api/blob/upload?pathname=${encodeURIComponent(pathname)}&contentType=${encodeURIComponent(file.type)}`,
      );
      if (!signedRes.ok) throw new Error("could not get signed URL");
      const { url, publicUrl } = (await signedRes.json()) as {
        url: string;
        publicUrl: string;
      };

      const putRes = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type },
      });
      if (!putRes.ok) throw new Error("upload failed");
      const putJson = (await putRes.json().catch(() => ({}))) as { url?: string };

      setState("saving");
      const sourceUrl = putJson.url ?? publicUrl;
      const sceneRes = await fetch("/api/scenes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourcePhotoUrl: sourceUrl,
          title: title || "Untitled memory",
          description: description || undefined,
          voiceCloneId: voice?.id,
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8"
    >
      {/* Photo guidance — Marble (the 3D model that rebuilds the room) works
          dramatically better on architectural interiors. Faces/people don't
          reconstruct well and trigger privacy concerns. Set expectations up
          front so the user doesn't burn $3+ on a photo that won't work. */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-5 py-4 text-sm">
        <p className="font-medium text-[var(--color-foreground)]">What works best</p>
        <ul className="mt-2 space-y-1 text-[var(--color-foreground-secondary)]">
          <li>· Interior rooms — kitchens, bedrooms, workshops, porches</li>
          <li>· Well-lit, shot roughly straight-on (not from a low angle)</li>
          <li>· Clear depth (objects at different distances, not a flat wall)</li>
        </ul>
        <p className="mt-3 font-medium text-[var(--color-foreground)]">What to avoid</p>
        <ul className="mt-2 space-y-1 text-[var(--color-foreground-secondary)]">
          <li>· People or faces — please don't upload photos of identifiable humans</li>
          <li>· Outdoor scenes, abstract art, or single objects on a blank background</li>
          <li>· Very dark, blurry, or low-resolution images</li>
        </ul>
      </div>

      {/* Voice section — either shows the loaded clone or invites the user to
          create one. Either way, makes the optional voice path discoverable
          (the gap was that /create and /voice were totally unlinked before). */}
      {voice ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-accent-glow)] px-5 py-4 text-sm">
          <div>
            <p className="font-medium text-[var(--color-foreground)]">
              Narration on · {voice.name}'s voice
            </p>
            <p className="text-xs text-[var(--color-foreground-muted)]">
              Your scene's description will play in this voice when someone walks through.
            </p>
          </div>
          <button
            type="button"
            onClick={clearVoice}
            className="rounded-full border border-[var(--color-border)] px-4 py-2 text-xs hover:bg-white/50"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--color-border-strong)] px-5 py-4 text-sm">
          <div>
            <p className="font-medium text-[var(--color-foreground)]">Optional: add a voice</p>
            <p className="text-xs text-[var(--color-foreground-muted)]">
              Clone a 30-second voice clip so the memory narrates itself.
            </p>
          </div>
          <a
            href="/voice"
            className="rounded-full bg-[var(--color-foreground)] px-4 py-2 text-xs text-[var(--color-bg)] hover:opacity-90"
          >
            Clone a voice →
          </a>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`group relative cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-dashed transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDragActive
            ? "border-[var(--color-accent)] bg-[var(--color-accent-glow)]"
            : "border-[var(--color-border-strong)] hover:border-[var(--color-foreground-secondary)]"
        }`}
        data-testid="dropzone"
      >
        <input {...getInputProps()} data-testid="file-input" />
        {preview ? (
          <div className="relative aspect-[4/3] w-full">
            {/* biome-ignore lint/performance/noImgElement: blob preview */}
            <img src={preview} alt="preview" className="h-full w-full object-cover" />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, transparent 60%, rgba(10,10,11,0.7) 100%)",
              }}
            />
            <p className="absolute bottom-4 left-5 text-sm text-white/80">
              Click to choose a different photo
            </p>
          </div>
        ) : (
          <div className="px-12 py-20 text-center">
            <p className="headline text-2xl text-[var(--color-foreground)]">
              {isDragActive ? "Drop the photo here." : "Drag a photo here, or click to browse."}
            </p>
            <p className="mt-3 text-sm text-[var(--color-foreground-muted)]">
              JPG · PNG · WEBP, up to 25 MB
            </p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="eyebrow mb-2 block">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Grandma's kitchen, 1995"
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-transparent px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)] outline-none transition-colors focus:border-[var(--color-accent)]"
            data-testid="title-input"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block">A note (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you remember about this place?"
            rows={3}
            className="w-full resize-none rounded-lg border border-[var(--color-border-strong)] bg-transparent px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)] outline-none transition-colors focus:border-[var(--color-accent)]"
            data-testid="description-input"
          />
        </label>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-4 py-3 text-sm text-[var(--color-destructive)]"
        >
          {error}
        </motion.div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!file || state === "uploading" || state === "saving"}
        className="btn-primary w-full rounded-full py-4 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="submit-button"
      >
        {state === "uploading"
          ? "Uploading…"
          : state === "saving"
            ? "Preparing your memory…"
            : "Bring this memory to life"}
      </button>
    </motion.div>
  );
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .slice(0, 60);
}
