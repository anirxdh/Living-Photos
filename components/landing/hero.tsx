"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Magnetic } from "@/components/motion/magnetic";
import { PetalRain } from "@/components/motion/petal-rain";
import { Button } from "@/components/ui/button";

/**
 * Cinematic single-image hero — exactly one viewport tall.
 *
 *   Layers (back → front):
 *     - Full-bleed painted nature scene with slow Ken Burns drift
 *     - Soft vignette anchored on the left so the white serif headline reads
 *     - Cherry blossom petals raining across the viewport
 *     - Left-anchored center column: eyebrow + headline + subhead + magnetic CTAs
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <section
      ref={ref}
      className="relative flex h-screen min-h-[640px] w-full flex-col justify-center overflow-hidden bg-[#9bb8c8]"
    >
      {/* Full-bleed painted scene with subtle Ken Burns drift. Anchored RIGHT so the
          cherry blossom tree stays in view; the empty middle of the image sits behind
          the headline on the left. */}
      <motion.div aria-hidden className="absolute inset-0 z-0" style={{ y: imageY }}>
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: "url('/images/hero-new.jpg')",
            backgroundPosition: "right center",
            animation: "ken-burns 45s ease-in-out infinite alternate",
            transformOrigin: "80% 50%",
          }}
        />
      </motion.div>

      {/* Left-side vignette so the white serif headline pops against the bright sky */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(95deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 28%, rgba(0,0,0,0.1) 52%, transparent 72%), linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 22%, transparent 65%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Cherry blossom petals drifting across the whole viewport */}
      <div className="absolute inset-0 z-[3]">
        <PetalRain count={32} />
      </div>

      {/* Foreground content — left-anchored so the headline doesn't overlap the tree */}
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start px-6 text-left md:px-12 lg:px-20"
        style={{ opacity }}
      >
        <motion.p
          className="eyebrow"
          style={{ color: "rgba(255,255,255,0.85)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          Memory reimagined
        </motion.p>

        <motion.h1
          className="headline mt-6 max-w-4xl text-[clamp(40px,6.5vw,92px)] leading-[1.02]"
          style={{ color: "#ffffff", textShadow: "0 2px 28px rgba(0,0,0,0.55)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="block" style={{ opacity: 0.92 }}>
            Step inside
          </span>
          <span className="block italic">a memory you can walk through.</span>
        </motion.h1>

        <motion.p
          className="mt-8 max-w-xl text-balance text-base md:text-lg"
          style={{
            color: "rgba(255,255,255,0.9)",
            textShadow: "0 1px 14px rgba(0,0,0,0.55)",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          Upload one photograph. Walk into it in 3D. Hear the voice of someone you loved play softly
          from inside the room.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3"
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
    </section>
  );
}
