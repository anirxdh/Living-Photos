"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Scene } from "@/lib/db/schema";

// R3F viewer is dynamically imported with SSR off — Three.js touches `window` immediately
const Viewer = dynamic(() => import("@/components/viewer/scene-viewer"), {
  ssr: false,
  loading: () => <div className="aspect-video animate-pulse rounded-2xl bg-muted" />,
});

export default function SceneClient({ scene: initialScene }: { scene: Scene }) {
  const [scene, setScene] = useState(initialScene);

  // Poll for status while pipeline runs (mock mode finishes in <1s, this is mainly
  // a visual progress indicator; phase 3 wires this to Inngest realtime).
  useEffect(() => {
    if (scene.status === "ready" || scene.status === "failed") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/scenes/${scene.id}`);
      if (!res.ok) return;
      const { scene: next } = (await res.json()) as { scene: Scene };
      setScene(next);
      if (next.status === "ready" || next.status === "failed") clearInterval(t);
    }, 1500);
    return () => clearInterval(t);
  }, [scene.id, scene.status]);

  if (scene.status !== "ready") {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-12 text-center">
        <p className="mb-3 text-lg">Preparing your memory…</p>
        <p className="text-sm text-muted-foreground">
          We're rebuilding the room in 3D. This takes a few minutes for a real photo — you can leave
          this page and come back.
        </p>
        <div className="mx-auto mt-6 h-2 w-64 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/3 animate-pulse bg-foreground" />
        </div>
      </div>
    );
  }

  if (!scene.paid) {
    return (
      <div className="rounded-2xl border border-border p-12 text-center">
        <p className="mb-2 text-2xl font-light">Your memory is ready.</p>
        <p className="mb-8 text-muted-foreground">Unlock it forever for $19.</p>
        <UnlockButton sceneId={scene.id} />
        <p className="mt-4 text-xs text-muted-foreground">
          One-time payment · No subscription · Share with family
        </p>
      </div>
    );
  }

  return <Viewer scene={scene} />;
}

function UnlockButton({ sceneId }: { sceneId: string }) {
  const [loading, setLoading] = useState(false);
  async function unlock() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sceneId }),
    });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
  }
  return (
    <button
      type="button"
      onClick={unlock}
      disabled={loading}
      className="rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
      data-testid="unlock-button"
    >
      {loading ? "Opening checkout…" : "Unlock memory — $19"}
    </button>
  );
}
