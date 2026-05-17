"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { Scene } from "@/lib/db/schema";
import { PRICE_DISPLAY } from "@/lib/pricing";

const Viewer = dynamic(() => import("@/components/viewer/scene-viewer"), {
  ssr: false,
  loading: () => (
    <div className="aspect-video animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface)]" />
  ),
});

export default function SceneClient({ scene: initialScene }: { scene: Scene }) {
  const [scene, setScene] = useState(initialScene);

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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <GlassCard className="text-center">
          <p className="headline text-3xl text-[var(--color-foreground)]">Preparing your memory…</p>
          <p className="mx-auto mt-4 max-w-md text-[var(--color-foreground-secondary)]">
            We're rebuilding the room in 3D. This takes about four to five minutes for a real photo
            — you can leave this page and come back.
          </p>
          <div className="mx-auto mt-10 h-px w-full max-w-md overflow-hidden bg-[var(--color-border)]">
            <motion.div
              className="h-full bg-[var(--color-accent)]"
              initial={{ width: "0%" }}
              animate={{ width: ["0%", "70%", "85%"] }}
              transition={{
                duration: 240,
                times: [0, 0.6, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  if (!scene.paid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <GlassCard className="text-center">
          <p className="eyebrow">Ready</p>
          <p className="mt-4 headline text-[clamp(36px,5vw,56px)] text-[var(--color-foreground)]">
            Your memory is ready to{" "}
            <span className="italic text-[var(--color-accent)]">step inside.</span>
          </p>
          <p className="mx-auto mt-6 max-w-md text-[var(--color-foreground-secondary)]">
            Unlock it forever for {PRICE_DISPLAY}. One-time payment, no subscription, yours to share with
            family.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <UnlockButton sceneId={scene.id} />
          </div>
          <p className="mt-6 text-xs text-[var(--color-foreground-muted)]">
            Apple Pay · Google Pay · Cards
          </p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <Viewer scene={scene} />
    </motion.div>
  );
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
    <Button onClick={unlock} disabled={loading} size="lg" variant="primary" testId="unlock-button">
      {loading ? "Opening checkout…" : `Unlock memory — ${PRICE_DISPLAY}`}
    </Button>
  );
}
