"use client";

import { useEffect } from "react";

/**
 * Waitlist gate modal — shown when a user tries to generate.
 * Explains the situation and offers 3 paths: DM, fork, star.
 */
export function WaitlistModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled in useEffect above
    // biome-ignore lint/a11y/noStaticElementInteractions: dialog role on this element makes it interactive
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" aria-hidden />

      {/* Modal */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only — no keyboard equivalent needed */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: container for modal content; click is just to stop bubble */}
      <div
        className="relative w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-[var(--color-foreground-muted)] transition-colors hover:text-[var(--color-foreground)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            role="img"
            aria-labelledby="waitlist-close-icon-title"
          >
            <title id="waitlist-close-icon-title">Close</title>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className="eyebrow">Currently waitlist-only</p>
        <h2 className="mt-4 headline text-[clamp(28px,4vw,40px)] leading-tight text-[var(--color-foreground)]">
          You're <span className="italic text-[var(--color-accent)]">early.</span>
        </h2>

        <p className="mt-6 text-[var(--color-foreground-secondary)]">
          Each Living Photo costs around <strong>$0.40</strong> in real API credits (World Labs +
          ElevenLabs + FAL + Stripe). Until we scale, generation is waitlist-only — but here are
          three ways forward:
        </p>

        <div className="mt-8 space-y-3">
          {/* DM path */}
          <a
            href="https://www.linkedin.com/in/agent-eleven-a695443b9/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all hover:border-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-elevated)]"
          >
            <span className="text-2xl">🚀</span>
            <div className="flex-1">
              <p className="font-medium text-[var(--color-foreground)]">Get one built for you</p>
              <p className="mt-1 text-sm text-[var(--color-foreground-secondary)]">
                DM me on <span className="text-[var(--color-accent)]">LinkedIn</span> or{" "}
                <a
                  href="https://x.com/anirxdhv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  X (@anirxdhv)
                </a>
                . I'll personally build yours within 24 hours.
              </p>
            </div>
            <span className="text-[var(--color-foreground-muted)] transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>

          {/* Fork path */}
          <a
            href="https://github.com/anirxdh/Living-Photos"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all hover:border-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-elevated)]"
          >
            <span className="text-2xl">🔑</span>
            <div className="flex-1">
              <p className="font-medium text-[var(--color-foreground)]">Bring your own API keys</p>
              <p className="mt-1 text-sm text-[var(--color-foreground-secondary)]">
                Fork the GitHub repo, plug in your ElevenLabs + Stripe + World Labs keys, generate
                unlimited memories yourself.
              </p>
            </div>
            <span className="text-[var(--color-foreground-muted)] transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>

          {/* Star path */}
          <a
            href="https://github.com/anirxdh/Living-Photos"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all hover:border-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-elevated)]"
          >
            <span className="text-2xl">⭐</span>
            <div className="flex-1">
              <p className="font-medium text-[var(--color-foreground)]">Star the repo</p>
              <p className="mt-1 text-sm text-[var(--color-foreground-secondary)]">
                It helps me know there's demand — and when we open up generation for everyone,
                you'll be first to know.
              </p>
            </div>
            <span className="text-[var(--color-foreground-muted)] transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-foreground-muted)]">
          Built for ElevenHacks 2026 · with ElevenLabs + Stripe
        </p>
      </div>
    </div>
  );
}
