import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";

const COLS = [
  {
    head: "Product",
    links: [
      { label: "Bring a memory to life", href: "/create" },
      { label: "My memories", href: "/dashboard" },
      { label: "Voice setup", href: "/voice" },
    ],
  },
  {
    head: "Company",
    links: [
      { label: "Press kit", href: "/press" },
      {
        label: "GitHub",
        href: "https://github.com/anirxdh/Living-Photos",
        external: true,
      },
    ],
  },
  {
    head: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Acceptable use", href: "/legal/aup" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="headline text-3xl text-[var(--color-foreground)]">
              Living Photos
            </Link>
            <p className="mt-4 max-w-sm text-sm text-[var(--color-foreground-secondary)]">
              For everyone you've ever loved. © 2026 Anirudh Vasudevan. All rights reserved.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.head}>
              <Eyebrow className="mb-5">{col.head}</Eyebrow>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm text-[var(--color-foreground-secondary)] transition-colors hover:text-[var(--color-foreground)]"
                      >
                        {link.label} ↗
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--color-foreground-secondary)] transition-colors hover:text-[var(--color-foreground)]"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-8 text-xs text-[var(--color-foreground-muted)]">
          <p>Built with ElevenLabs · Stripe · World Labs Marble · FAL Hunyuan3D</p>
          <p>#ElevenHacks · @stripe · @elevenlabsio</p>
        </div>
      </div>
    </footer>
  );
}
