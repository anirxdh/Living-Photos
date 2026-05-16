"use client";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg)] py-32 lg:py-48">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at top, rgba(217,165,96,0.18) 0%, transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <p className="headline text-[clamp(40px,7vw,96px)] leading-[1.05]">
            Step inside a memory
            <br />
            <span className="italic text-[var(--color-accent)]">today.</span>
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-8 max-w-xl text-[var(--color-foreground-secondary)]">
            One photo. Five minutes. $19. Yours forever.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-12">
            <Button href="/create" size="lg" variant="primary">
              Bring a memory to life
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
