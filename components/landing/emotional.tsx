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
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);

  return (
    <section ref={ref} className="relative h-[110vh] w-full overflow-hidden bg-[var(--color-bg)]">
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519752594763-2633d8638eef?w=2400&q=85&auto=format&fit=crop')",
          }}
        />
      </motion.div>

      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,11,0.7) 0%, rgba(10,10,11,0.4) 40%, rgba(10,10,11,0.4) 60%, rgba(10,10,11,0.85) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full items-center justify-center px-6">
        <Reveal className="max-w-4xl text-center">
          <p className="headline text-[clamp(36px,5.5vw,72px)] leading-[1.15] text-white">
            “Some places only exist in memory.
            <br />
            <span className="italic text-[var(--color-accent)]">
              We make them places you can step inside again.
            </span>
            ”
          </p>
        </Reveal>
      </div>
    </section>
  );
}
