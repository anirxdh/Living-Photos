"use client";

/**
 * Banner shown at the top of /create explaining the waitlist situation.
 */
export function WaitlistBanner() {
  return (
    <div className="mb-10 rounded-[var(--radius-md)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-5">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden>
          🤝
        </span>
        <div className="flex-1">
          <p className="font-medium text-[var(--color-foreground)]">Currently waitlist-only</p>
          <p className="mt-1.5 text-sm text-[var(--color-foreground-secondary)]">
            Each Living Photo costs ~$0.40 in API credits. While we scale, generation is gated.{" "}
            <a
              href="https://x.com/anirxdhv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] underline hover:text-[var(--color-foreground)]"
            >
              DM me on X (@anirxdhv)
            </a>{" "}
            and I'll build yours within 24 hours, or{" "}
            <a
              href="https://github.com/anirxdh/Living-Photos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] underline hover:text-[var(--color-foreground)]"
            >
              fork the repo
            </a>{" "}
            and bring your own keys.
          </p>
        </div>
      </div>
    </div>
  );
}
