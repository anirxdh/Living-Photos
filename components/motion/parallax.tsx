"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Subtle mouse-driven parallax. Tracks pointer position relative to its
 * container and translates children by up to `intensity` px. Spring-damped
 * for a premium soft-follow feel. Mobile / touch falls back to no motion.
 */
export function MouseParallax({
  children,
  intensity = 12,
  className,
}: {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tx = useSpring(x, { stiffness: 80, damping: 20, mass: 0.6 });
  const ty = useSpring(y, { stiffness: 80, damping: 20, mass: 0.6 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function move(e: MouseEvent) {
      // Track pointer relative to the centre of the viewport for hero use.
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dx = (e.clientX - w / 2) / (w / 2);
      const dy = (e.clientY - h / 2) / (h / 2);
      x.set(dx * intensity);
      y.set(dy * intensity);
    }
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [intensity, x, y]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ x: tx, y: ty }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
