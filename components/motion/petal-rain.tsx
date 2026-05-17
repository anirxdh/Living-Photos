"use client";

import { useEffect, useState } from "react";

/**
 * Petal rain — drifting cherry blossom petals layered over the hero.
 * Each petal has a nested span structure:
 *   outer span: linear top→bottom fall (8–16s, randomized)
 *   inner span: sideways sway + slow rotate (2–6s, alternates)
 * The compound transform gives organic, wind-tossed motion. Generated
 * client-side after mount to avoid SSR hydration mismatches from the
 * randomized values.
 */
export function PetalRain({ count = 28 }: { count?: number }) {
  const [petals, setPetals] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    duration: number;
    swayDuration: number;
    size: number;
    rotate: number;
    opacity: number;
    hue: number;
  }> | null>(null);

  useEffect(() => {
    setPetals(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: -Math.random() * 16, // negative so petals are mid-fall on mount
        duration: 9 + Math.random() * 8,
        swayDuration: 2.5 + Math.random() * 3,
        size: 8 + Math.random() * 14,
        rotate: Math.random() * 360,
        opacity: 0.5 + Math.random() * 0.45,
        hue: -10 + Math.random() * 25, // small hue jitter for variety
      })),
    );
  }, [count]);

  if (!petals) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute block"
          style={{
            left: `${p.left}%`,
            top: "-6%",
            width: p.size,
            height: p.size * 1.4,
            opacity: p.opacity,
            animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite`,
            filter: `hue-rotate(${p.hue}deg)`,
          }}
        >
          <span
            className="block h-full w-full"
            style={{
              background:
                "radial-gradient(ellipse at 30% 30%, #fff5f8 0%, #fbc8d4 55%, #ef8aa8 100%)",
              borderRadius: "60% 40% 60% 40% / 50% 60% 40% 50%",
              transform: `rotate(${p.rotate}deg)`,
              animation: `petal-sway ${p.swayDuration}s ease-in-out ${-p.delay * 0.3}s infinite alternate`,
              boxShadow: "0 0 6px rgba(248,187,208,0.45)",
            }}
          />
        </span>
      ))}
    </div>
  );
}
