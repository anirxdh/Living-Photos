"use client";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { GlassCard } from "@/components/ui/glass-card";
import { Headline } from "@/components/ui/headline";
import { PRICE_DISPLAY } from "@/lib/pricing";

const INCLUDED = [
  "Walk through your scene on any phone or laptop",
  "Optional voice clone — narration plays from inside the room",
  "A share URL — send it to anyone, no signup required",
  "Yours forever, no subscription",
];

export function Pricing() {
  return (
    <section className="relative bg-[var(--color-bg)] py-32 lg:py-48">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <Eyebrow className="mb-4">Pricing</Eyebrow>
        </Reveal>
        <Reveal delay={0.1}>
          <Headline size="section">
            One photo. <span className="italic headline-soft">Forever yours.</span>
          </Headline>
        </Reveal>

        <Reveal delay={0.25} className="mt-16">
          <GlassCard className="text-left">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--color-border)] pb-8">
              <div>
                <p className="eyebrow">Single memory</p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="headline text-7xl">{PRICE_DISPLAY}</span>
                  <span className="text-sm text-[var(--color-foreground-muted)]">
                    once · no subscription
                  </span>
                </p>
              </div>
              <Button href="/create" size="lg" variant="primary">
                Bring a memory to life
              </Button>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-[var(--color-foreground-secondary)]"
                >
                  <span
                    className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--color-accent)]"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </Reveal>

        <Reveal delay={0.4}>
          <p className="mt-8 text-xs text-[var(--color-foreground-muted)]">
            Family plan ($49 / year unlimited) and Lifetime archive ($299) launching after V1.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
