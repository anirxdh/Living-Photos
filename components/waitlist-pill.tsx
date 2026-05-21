"use client";

/**
 * Subtle pill shown under hero CTAs explaining the waitlist situation.
 * Designed to be readable over the dark hero video background.
 */
export function WaitlistPill() {
  return (
    <a
      href="https://www.linkedin.com/in/agent-eleven-a695443b9/"
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-xs backdrop-blur-md transition-all hover:bg-black/60 hover:border-white/50"
      style={{ color: "rgba(255,255,255,0.85)" }}
    >
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#7eb87e]" />
      <span>
        Currently waitlist-only · <span className="underline">DM to get yours</span>
      </span>
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </a>
  );
}
