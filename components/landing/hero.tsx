"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Magnetic } from "@/components/motion/magnetic";
import { MouseParallax } from "@/components/motion/parallax";
import { Tilt3D } from "@/components/motion/tilt-3d";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { Button } from "@/components/ui/button";

/**
 * Synex-style layered hero.
 *
 *   Z-stack (back → front):
 *     - Misty cream background
 *     - Foggy mountain photo, faded
 *     - Rock/boulder edges (left + right) with mouse parallax
 *     - Center column: eyebrow, big serif headline, subhead, CTAs
 *     - Floating browser mockup of the 3D scene with glassmorphic widget cards
 *
 *   Each layer reacts to the cursor at a different intensity, creating depth.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative w-full overflow-hidden bg-[var(--color-bg)] pb-32 pt-40">
      {/* Background mist */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 0%, rgba(255,255,255,0.8) 0%, transparent 60%)",
        }}
      />

      {/* Left rock — drifts a little with mouse */}
      <MouseParallax
        intensity={20}
        className="absolute left-0 top-0 z-[1] h-full w-[32vw] max-w-[520px]"
      >
        <div
          className="h-full w-full bg-cover opacity-100"
          style={{
            backgroundImage: "url('/images/hero-rock-left.jpg')",
            backgroundPosition: "right center",
            maskImage: "linear-gradient(to right, black 55%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 55%, transparent 100%)",
          }}
        />
      </MouseParallax>

      {/* Right rock — slightly different intensity for depth */}
      <MouseParallax
        intensity={24}
        className="absolute right-0 top-0 z-[1] h-full w-[32vw] max-w-[520px]"
      >
        <div
          className="h-full w-full bg-cover opacity-100"
          style={{
            backgroundImage: "url('/images/hero-rock-right.jpg')",
            backgroundPosition: "left center",
            maskImage: "linear-gradient(to left, black 55%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 55%, transparent 100%)",
          }}
        />
      </MouseParallax>

      {/* Foreground content */}
      <motion.div
        className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 text-center"
        style={{ opacity }}
      >
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          Memory reimagined
        </motion.p>

        <motion.h1
          className="headline mt-8 text-[clamp(48px,9vw,128px)] leading-[0.95]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="block headline-soft">Step inside</span>
          <span className="block">a memory you can walk through.</span>
        </motion.h1>

        <motion.p
          className="mt-10 max-w-xl text-balance text-base text-[var(--color-foreground-secondary)] md:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          Upload one photograph. Walk into it in 3D. Hear the voice of someone you loved play softly
          from inside the room.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <Magnetic radius={140} strength={0.4}>
            <Button href="/create" size="lg" variant="primary">
              Bring a memory to life
            </Button>
          </Magnetic>
          <Magnetic radius={120} strength={0.3}>
            <Button href="#how-it-works" size="lg" variant="secondary">
              See how it works
            </Button>
          </Magnetic>
        </motion.div>
      </motion.div>

      {/* Floating browser mockup — the "real product" floats below the headline.
          Tilt3D wraps it so the whole composition catches the light on mouse move. */}
      <motion.div
        className="relative z-10 mx-auto mt-24 max-w-5xl px-6"
        style={{ y: mockupY }}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.3, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Tilt3D max={5} perspective={1600}>
          <MockupComposition />
        </Tilt3D>
      </motion.div>
    </section>
  );
}

/**
 * The hero's centerpiece — a browser-framed 3D scene preview with floating
 * glassmorphic widget cards around it, lifted directly from the Synex pattern.
 */
function MockupComposition() {
  return (
    <div className="relative">
      <BrowserFrame url="livingphotos.app/s/grandma-kitchen-1995">
        <div
          className="relative aspect-[16/10] w-full overflow-hidden"
          style={{
            backgroundImage: "url('/images/scene-kitchen.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 50%, rgba(20,17,13,0.6) 100%)",
            }}
          />
          {/* In-scene title chip */}
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-70">Now exploring</p>
              <p className="mt-1 font-serif text-lg italic">Grandma's kitchen, summer '95</p>
            </div>
          </div>
        </div>
      </BrowserFrame>

      {/* Floating widget — top-left "Voice playing" */}
      <motion.div
        className="absolute -left-8 top-12 hidden md:block"
        style={{ animation: "float 6s ease-in-out infinite" }}
      >
        <div className="glass rounded-2xl px-5 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-foreground-muted)]">
            Voice
          </p>
          <p className="mt-1 flex items-center gap-2 font-medium text-[var(--color-foreground)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            </span>
            Grandma narrating
          </p>
        </div>
      </motion.div>

      {/* Floating widget — top-right "Saved forever" */}
      <motion.div
        className="absolute -right-6 top-24 hidden md:block"
        style={{ animation: "drift 8s ease-in-out infinite", animationDelay: "-2s" }}
      >
        <div className="glass-dark rounded-2xl px-5 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.25em] opacity-60">Saved</p>
          <p className="mt-1 font-serif text-lg italic">$19 — forever</p>
        </div>
      </motion.div>

      {/* Floating widget — bottom-left "Share" */}
      <motion.div
        className="absolute -left-4 bottom-12 hidden md:block"
        style={{ animation: "float 7s ease-in-out infinite", animationDelay: "-3s" }}
      >
        <div className="glass rounded-2xl px-5 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-foreground-muted)]">
            Share
          </p>
          <p className="mt-1 font-medium text-[var(--color-foreground)]">livingphotos.app/s/abc</p>
        </div>
      </motion.div>

      {/* Floating widget — bottom-right "Step inside" */}
      <motion.div
        className="absolute -right-6 bottom-20 hidden md:block"
        style={{ animation: "drift 9s ease-in-out infinite", animationDelay: "-4s" }}
      >
        <div className="glass rounded-full px-5 py-2.5">
          <p className="font-medium text-[var(--color-foreground)]">Step inside →</p>
        </div>
      </motion.div>
    </div>
  );
}
