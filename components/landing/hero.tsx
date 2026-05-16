"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MouseParallax } from "@/components/motion/parallax";
import { Button } from "@/components/ui/button";

/**
 * Full-viewport cinematic hero. A warm Unsplash interior with grain + vignette
 * sits behind a giant serif headline. The background drifts slightly with
 * the mouse; the headline + CTA fade up on mount. Scroll triggers a slow
 * vertical parallax + opacity fade so the next section feels like it's
 * lifting the hero out of frame.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] w-full overflow-hidden bg-[var(--color-bg)]">
      {/* Background image with mouse parallax + scroll parallax */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <MouseParallax intensity={16} className="absolute inset-[-3%]">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2400&q=85&auto=format&fit=crop')",
            }}
          />
        </MouseParallax>
      </motion.div>

      {/* Warm gradient + vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,11,0.65) 0%, rgba(10,10,11,0.4) 35%, rgba(10,10,11,0.75) 75%, rgba(10,10,11,0.95) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,11,0.6) 100%)",
        }}
      />

      {/* Drifting dust motes */}
      <DustMotes />

      {/* Foreground content */}
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
        style={{ y: contentY, opacity }}
      >
        <motion.p
          className="eyebrow mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          For everyone you've ever loved
        </motion.p>

        <motion.h1
          className="headline text-[clamp(56px,11vw,164px)] leading-[0.92] text-[var(--color-foreground)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Step inside
          <br />
          <span className="italic text-[var(--color-foreground-secondary)]">a memory.</span>
        </motion.h1>

        <motion.p
          className="mt-8 max-w-xl text-balance text-base text-[var(--color-foreground-secondary)] md:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          Upload one old photograph. Walk into it in 3D. Hear the voice of someone you loved play
          softly from inside the room.
        </motion.p>

        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button href="/create" size="lg" variant="primary">
            Bring a memory to life — $19
          </Button>
          <Button href="#how-it-works" size="lg" variant="secondary">
            See how it works
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
      >
        <motion.div
          className="flex h-10 w-6 items-start justify-center rounded-full border border-[var(--color-foreground-muted)]"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <span className="mt-2 h-1.5 w-0.5 rounded-full bg-[var(--color-foreground-secondary)]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/** Slow-drifting backlit dust particles. Pure CSS — light on perf. */
const DUST_MOTES = Array.from({ length: 16 }, (_, i) => ({
  id: `mote-${i}`,
  size: 1 + Math.random() * 2.5,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 8 + Math.random() * 16,
  delay: Math.random() * -10,
}));

function DustMotes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {DUST_MOTES.map((m) => (
        <span
          key={m.id}
          className="absolute rounded-full bg-[var(--color-accent)] opacity-30 blur-[1px]"
          style={{
            width: `${m.size}px`,
            height: `${m.size}px`,
            left: `${m.left}%`,
            top: `${m.top}%`,
            animation: `drift ${m.duration}s ease-in-out infinite`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
