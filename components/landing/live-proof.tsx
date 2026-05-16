"use client";

import { Reveal } from "@/components/motion/reveal";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";

/**
 * Real-product section. Wraps a static cinematic preview in a fake browser
 * chrome (matching the Synex reference). Replace the inner content with the
 * live R3F viewer once we have a published fixture .spz; today it's a warm
 * still that reads as "this is the product you'll be using".
 */
export function LiveProof() {
  return (
    <section className="relative bg-[var(--color-bg)] py-32 lg:py-48">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-3xl">
          <Reveal>
            <Eyebrow className="mb-4">The product</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <Headline size="section">
              Not a video.{" "}
              <span className="italic text-[var(--color-foreground-secondary)]">
                A place you walk through.
              </span>
            </Headline>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-base text-[var(--color-foreground-secondary)] md:text-lg">
              Open the link on any phone or laptop. Drag to look around. Move through the room. Hear
              the voice play softly as you go.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <BrowserFrame url="livingphotos.app/s/grandma-kitchen-1995">
            <div
              className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--color-bg)]"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2000&q=85&auto=format&fit=crop')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.6) 100%)",
                }}
              />
              {/* Floating "now playing" caption — feels real */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] opacity-70">Now exploring</p>
                  <p className="mt-1 font-serif text-2xl italic">Grandma's kitchen, summer '95</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                  </span>
                  Voice playing
                </div>
              </div>
            </div>
          </BrowserFrame>
        </Reveal>

        <Reveal delay={0.4}>
          <p className="mt-6 text-center text-sm text-[var(--color-foreground-muted)]">
            Sarah uploaded a photo of her grandmother's kitchen. This is what she got back.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
