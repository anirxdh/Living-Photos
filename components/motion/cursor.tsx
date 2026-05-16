"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Premium two-element custom cursor.
 *   - Small dot follows the mouse exactly.
 *   - Larger ring trails with spring physics; grows when hovering an
 *     interactive element (anchor, button, [data-cursor="hover"]).
 * Hidden on touch / coarse-pointer devices.
 */
export function Cursor() {
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.5 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    setEnabled(fine);
    if (!fine) return;

    function move(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    }
    function enter() {
      setVisible(true);
    }
    function leave() {
      setVisible(false);
    }

    function over(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInteractive = !!target.closest(
        'a, button, [role="button"], input, textarea, select, [data-cursor="hover"]',
      );
      setHovering(isInteractive);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseenter", enter);
    document.body.addEventListener("mouseleave", leave);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseenter", enter);
      document.body.removeEventListener("mouseleave", leave);
      window.removeEventListener("mouseover", over);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-foreground)] mix-blend-difference"
        style={{ x, y, opacity: visible ? 1 : 0 }}
        animate={{ scale: hovering ? 0 : 1 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-foreground)] mix-blend-difference"
        style={{
          x: ringX,
          y: ringY,
          opacity: visible ? 1 : 0,
        }}
        animate={{
          width: hovering ? 48 : 28,
          height: hovering ? 48 : 28,
          opacity: visible ? (hovering ? 0.7 : 0.35) : 0,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </>
  );
}
