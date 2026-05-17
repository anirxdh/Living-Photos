"use client";

import { motion } from "framer-motion";
import { Reveal, RevealGroup, revealItem } from "@/components/motion/reveal";
import { Headline } from "@/components/ui/headline";

interface Step {
  n: string;
  title: string;
  body: string;
  bg: string;
  accentTint: string;
}

const STEPS: Step[] = [
  {
    n: "[ 1 ]",
    title: "Total memory recall",
    body: "Drop one interior photo — kitchen, porch, bedroom. Old film prints work best. Any phone or laptop can upload.",
    bg: "/images/scene-kitchen.jpg",
    accentTint: "rgba(184, 132, 92, 0.18)",
  },
  {
    n: "[ 2 ]",
    title: "Precise 3D reconstruction",
    body: "World Labs rebuilds the entire room. FAL Hunyuan3D adds objects you can walk around. Five minutes, end to end.",
    bg: "/images/scene-workshop.jpg",
    accentTint: "rgba(74, 122, 90, 0.18)",
  },
  {
    n: "[ 3 ]",
    title: "Voice that lives there",
    body: "Upload 30 seconds of a loved one's voice. ElevenLabs clones it. They narrate softly from inside the room.",
    bg: "/images/hero-rock-right.jpg",
    accentTint: "rgba(184, 132, 92, 0.18)",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-[var(--color-bg)] py-32 lg:py-48">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 flex flex-wrap items-end justify-between gap-12">
          <div className="max-w-2xl">
            <Reveal>
              <Headline size="section" className="leading-[1.05]">
                Clarity and warmth for every part of the memory.
              </Headline>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-xs text-sm text-[var(--color-foreground-secondary)]">
              Get a clear, structured way to step inside the moments that mattered — from the room
              itself, to the objects in it, to the voices of the people who were there.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="grid gap-6 md:grid-cols-3" stagger={0.12}>
          {STEPS.map((step) => (
            <motion.article key={step.n} variants={revealItem} className="group">
              <p className="mb-5 text-xs font-mono text-[var(--color-foreground-muted)]">
                {step.n}
              </p>
              <h3 className="text-xl font-medium text-[var(--color-foreground)]">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-foreground-secondary)]">
                {step.body}
              </p>
              <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                    style={{ backgroundImage: `url(${step.bg})` }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(180deg, ${step.accentTint} 0%, transparent 50%, rgba(20,17,13,0.7) 100%)`,
                    }}
                  />
                  {/* Floating product chip on each card */}
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="glass rounded-xl px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-foreground-muted)]">
                        {step.n === "[ 1 ]"
                          ? "Photo uploaded"
                          : step.n === "[ 2 ]"
                            ? "Scene built"
                            : "Voice attached"}
                      </p>
                      <p className="mt-1 font-serif text-base italic text-[var(--color-foreground)]">
                        {step.n === "[ 1 ]"
                          ? "Just now"
                          : step.n === "[ 2 ]"
                            ? "4 min 12 sec"
                            : "Grandma · 30s"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
