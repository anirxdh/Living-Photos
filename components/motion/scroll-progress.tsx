"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Hairline progress bar at the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed left-0 top-0 z-[9000] h-px w-full origin-left bg-[var(--color-accent)]"
      style={{ scaleX: width }}
    />
  );
}
