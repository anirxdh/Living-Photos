"use client";

import { motion } from "framer-motion";
import { Reveal, RevealGroup, revealItem } from "@/components/motion/reveal";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";

interface Step {
  n: string;
  title: string;
  body: string;
  bg: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    title: "Upload a photo",
    body: "Any interior — a kitchen, a porch, a bedroom. Old film prints work best.",
    bg: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400&q=85&auto=format&fit=crop",
  },
  {
    n: "02",
    title: "We rebuild it in 3D",
    body: "World Labs reconstructs the space. FAL Hunyuan3D adds objects you can walk around.",
    bg: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1400&q=85&auto=format&fit=crop",
  },
  {
    n: "03",
    title: "Hear them speak",
    body: "Upload a voice clip. ElevenLabs clones it. They narrate from inside the room.",
    bg: "https://images.unsplash.com/photo-1519752594763-2633d8638eef?w=1400&q=85&auto=format&fit=crop",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-[var(--color-bg)] py-32 lg:py-48">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-20 max-w-3xl">
          <Reveal>
            <Eyebrow className="mb-4">How it works</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <Headline size="section">
              Five minutes from a photo to a place{" "}
              <span className="italic text-[var(--color-foreground-secondary)]">
                you can stand inside.
              </span>
            </Headline>
          </Reveal>
        </div>

        <RevealGroup className="grid gap-6 md:grid-cols-3" stagger={0.15}>
          {STEPS.map((step) => (
            <motion.article
              key={step.n}
              variants={revealItem}
              className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                  style={{ backgroundImage: `url(${step.bg})` }}
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,10,11,0.15) 0%, rgba(10,10,11,0.85) 100%)",
                  }}
                />
                <div className="absolute inset-0 flex flex-col justify-between p-7">
                  <p className="font-mono text-xs text-[var(--color-foreground-secondary)]">
                    [ {step.n} ]
                  </p>
                  <div>
                    <h3 className="headline text-3xl text-white">{step.title}</h3>
                    <p className="mt-3 max-w-xs text-sm text-white/75">{step.body}</p>
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
