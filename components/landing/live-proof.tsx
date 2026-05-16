"use client";

import { motion } from "framer-motion";
import { MouseParallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { Tilt3D } from "@/components/motion/tilt-3d";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";

/**
 * Synex-style "product floating between organic branches" section.
 *
 *   Layers: mossy branches at edges, browser mockup centered, floating cards
 *   drift around it. Mouse near branches → composition tilts subtly.
 */
export function LiveProof() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg)] py-32 lg:py-48">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mb-4">The product</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <Headline size="section">
              Not a video. <span className="italic headline-soft">A place you walk through.</span>
            </Headline>
          </Reveal>
        </div>

        {/* Layered composition */}
        <div className="relative">
          {/* Left branch */}
          <MouseParallax
            intensity={18}
            className="absolute -left-20 top-1/2 z-[1] hidden h-[120%] w-[44vw] max-w-[640px] -translate-y-1/2 md:block"
          >
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/branch-left.jpg')",
                maskImage: "linear-gradient(to right, black 55%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, black 55%, transparent 100%)",
              }}
            />
          </MouseParallax>

          {/* Right branch */}
          <MouseParallax
            intensity={22}
            className="absolute -right-20 top-1/2 z-[1] hidden h-[120%] w-[44vw] max-w-[640px] -translate-y-1/2 md:block"
          >
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/branch-right.jpg')",
                maskImage: "linear-gradient(to left, black 55%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to left, black 55%, transparent 100%)",
              }}
            />
          </MouseParallax>

          {/* Centerpiece — Tilt3D so the composition responds to mouse position */}
          <Reveal delay={0.25}>
            <Tilt3D max={6} perspective={1500} className="relative z-10 mx-auto max-w-3xl">
              <div className="relative">
                <BrowserFrame url="livingphotos.app/s/grandpa-workshop">
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden"
                    style={{
                      backgroundImage: "url('/images/scene-workshop.jpg')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, transparent 40%, rgba(20,17,13,0.7) 100%)",
                      }}
                    />
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="text-[10px] uppercase tracking-[0.3em] opacity-70">
                        Memory ready
                      </p>
                      <p className="mt-1 font-serif text-xl italic">Dad's workshop, fall '88</p>
                    </div>
                  </div>
                </BrowserFrame>

                {/* Floating data card — captured opportunity */}
                <motion.div
                  className="absolute -left-12 top-16 hidden md:block"
                  style={{ animation: "float 7s ease-in-out infinite" }}
                >
                  <div className="glass rounded-2xl px-5 py-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-foreground-muted)]">
                      +30s of his voice
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-serif italic text-[var(--color-foreground)]">
                      "Come on in, kid."
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-foreground)] px-3 py-1 text-xs text-[var(--color-bg)]">
                      Listen
                    </div>
                  </div>
                </motion.div>

                {/* Floating signal strength card */}
                <motion.div
                  className="absolute -right-10 top-32 hidden md:block"
                  style={{ animation: "drift 9s ease-in-out infinite", animationDelay: "-1.5s" }}
                >
                  <div className="glass rounded-2xl px-5 py-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-foreground-muted)]">
                      Scene fidelity
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="font-serif text-3xl italic text-[var(--color-foreground)]">
                        87
                      </span>
                      <span className="text-xs text-[var(--color-success)]">✓ ready</span>
                    </div>
                  </div>
                </motion.div>

                {/* Floating alert card */}
                <motion.div
                  className="absolute -right-4 bottom-12 hidden md:block"
                  style={{ animation: "float 8s ease-in-out infinite", animationDelay: "-3s" }}
                >
                  <div className="glass-dark rounded-2xl px-5 py-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] opacity-60">
                      Now playing
                    </p>
                    <p className="mt-1 font-medium">Ambient · workshop sounds</p>
                  </div>
                </motion.div>
              </div>
            </Tilt3D>
          </Reveal>
        </div>

        <Reveal delay={0.4}>
          <p className="mt-16 text-center text-sm text-[var(--color-foreground-muted)]">
            Sarah uploaded a photo of her grandfather's workshop. This is what she got back.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
