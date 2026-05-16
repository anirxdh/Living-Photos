"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Magnetic wrapper — child element drifts toward the cursor when it's
 * within `radius` pixels of the element's centre. Linear/Vercel signature
 * effect. Spring-damped so the pull feels gentle, not snappy.
 *
 *   <Magnetic>
 *     <Button>Click me</Button>
 *   </Magnetic>
 */
export function Magnetic({
  children,
  radius = 120,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  radius?: number;
  /** 0 = no pull, 1 = cursor sits exactly on the element. */
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 14, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 200, damping: 14, mass: 0.35 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function move(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        x.set(0);
        y.set(0);
        return;
      }
      // Falloff so the pull weakens toward the edge of the radius
      const falloff = 1 - dist / radius;
      x.set(dx * strength * falloff);
      y.set(dy * strength * falloff);
    }
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [radius, strength, x, y]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ x: sx, y: sy }}>{children}</motion.div>
    </div>
  );
}
