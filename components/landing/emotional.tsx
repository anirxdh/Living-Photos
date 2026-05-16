"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "@/components/motion/reveal";

export function Emotional() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden bg-[var(--color-bg)] py-40 lg:py-56"
    >
      {/* Soft warm tint */}
      <motion.div className="absolute inset-0 z-0" style={{ y }}>
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(184,132,92,0.10) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <p className="headline text-[clamp(32px,5vw,64px)] leading-[1.2]">
            “Some places only exist in memory.
            <br />
            <span className="italic text-[var(--color-accent)]">
              We make them places you can step inside again.”
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
