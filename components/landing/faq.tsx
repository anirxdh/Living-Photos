"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";

const ITEMS = [
  {
    q: "What if I don't have a voice clip of the person?",
    a: "You don't need one. The scene works with just the photo — you can walk through the space in silence or with ambient sound only. The voice is an optional layer for when you do have a recording (a voicemail, an old video, a clip from a wedding).",
  },
  {
    q: "Is voice cloning safe? Could someone misuse this?",
    a: "We require a live attestation recording before any voice is cloned. The named person has to read a phrase out loud that includes a unique code we generate for them. Public-figure names are denylisted. You can revoke any cloned voice at any time from your dashboard, and we delete it upstream from ElevenLabs immediately.",
  },
  {
    q: "What kinds of photos work best?",
    a: "Interior shots — kitchens, bedrooms, porches, living rooms — with one or two clear focal points. Good lighting helps. Old film prints work, but very blurry or extremely dark photos may produce uncanny results.",
  },
  {
    q: "How long does it take?",
    a: "About four to five minutes per scene. The 3D world generation is the slow step; the rest is fast. You'll get an email when yours is ready, so you can close the tab and come back.",
  },
  {
    q: "What happens to my photos and voice samples?",
    a: "They live in our storage only as long as the scene exists. Delete the scene from your dashboard and they go with it. We don't train AI on your data, sell it, or share it with anyone.",
  },
];

export function FAQ() {
  return (
    <section className="relative bg-[var(--color-bg)] py-32 lg:py-48">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-16 text-center">
          <Reveal>
            <Eyebrow className="mb-4">Questions</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <Headline size="section">Things people ask.</Headline>
          </Reveal>
        </div>

        <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {ITEMS.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.05}>
              <FaqRow q={item.q} a={item.a} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-start justify-between gap-6 text-left"
      >
        <span className="text-lg font-medium text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-accent)] md:text-xl">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-foreground-secondary)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]"
          aria-hidden
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-base leading-relaxed text-[var(--color-foreground-secondary)] md:max-w-2xl">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
