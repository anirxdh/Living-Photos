"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor reveal — two stacked layers. The `base` layer is always visible;
 * the `reveal` layer is clipped to a soft circular mask that follows the
 * cursor. As you sweep the mouse across, the second image "bleeds through"
 * the first in a halo around the pointer. Pure CSS mask, no canvas.
 *
 *   <CursorReveal
 *     radius={280}
 *     base={<img src="/now.jpg" />}
 *     reveal={<img src="/then.jpg" />}
 *   />
 *
 * This is the "peek through time" effect — the entire product thesis
 * compressed into a hover interaction.
 */
export function CursorReveal({
  base,
  reveal,
  radius = 240,
  className,
  /** Optional thin ring around the cursor halo. Subtle by default. */
  ringColor = "rgba(255,255,255,0.45)",
}: {
  base: React.ReactNode;
  reveal: React.ReactNode;
  radius?: number;
  className?: string;
  ringColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!window.matchMedia("(pointer: fine)").matches) return;

    function move(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pad = radius * 0.4; // small leeway so the halo doesn't snap on/off at the edge
      if (
        e.clientX < rect.left - pad ||
        e.clientX > rect.right + pad ||
        e.clientY < rect.top - pad ||
        e.clientY > rect.bottom + pad
      ) {
        setPos(null);
        return;
      }
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    function leave() {
      setPos(null);
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, [radius]);

  // Hard at the center, soft falloff at the edges — feels like a flashlight
  const maskImage = pos
    ? `radial-gradient(circle ${radius}px at ${pos.x}px ${pos.y}px, black 0%, rgba(0,0,0,0.9) 45%, transparent 100%)`
    : "radial-gradient(circle 0px at 50% 50%, black, transparent)";

  return (
    <div ref={ref} className={className} style={{ position: "relative" }}>
      {/* Base — always visible. Absolute so it fills the container at the same size
          as the reveal layer (which is also absolute). The container itself must
          have explicit dimensions via the caller's `className` (e.g. h-full w-full). */}
      <div style={{ position: "absolute", inset: 0 }}>{base}</div>

      {/* Reveal — clipped to cursor halo */}
      {!reduced && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            maskImage,
            WebkitMaskImage: maskImage,
            transition: pos ? "none" : "opacity 0.4s ease",
            opacity: pos ? 1 : 0,
          }}
        >
          {reveal}
        </div>
      )}

      {/* Optional ring — only visible when active */}
      {!reduced && pos && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: pos.x - radius,
            top: pos.y - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: "50%",
            pointerEvents: "none",
            boxShadow: `inset 0 0 0 1px ${ringColor}`,
            mixBlendMode: "overlay",
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
}
