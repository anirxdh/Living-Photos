"use client";

import { motion, type Variants } from "framer-motion";

/**
 * Scroll-triggered reveal wrapper. Fades + slides children up the first time
 * they enter the viewport. The default timing is deliberately restrained — no
 * bouncy springs, just one clean easeOutExpo. Children can override via the
 * `delay` prop for staggered effects.
 */

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "p" | "h1" | "h2" | "h3";
}

export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Comp>
  );
}

/** Stagger container for sequencing child reveals. */
export function RevealGroup({
  children,
  className,
  stagger = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: 0.1 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const revealItem: Variants = variants;
