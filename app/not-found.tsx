import Link from "next/link";

/**
 * Custom 404 — minimal Server Component, no client-only motion components.
 * Replaces Next.js's auto-generated _not-found page which fails to prerender
 * when the root layout's SmoothScroll/Cursor chunks get pulled into SSR.
 *
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-foreground-muted)]">
        Lost in the archive
      </p>
      <h1 className="mt-6 headline text-[clamp(48px,7vw,96px)] text-[var(--color-foreground)]">
        Memory not <span className="italic text-[var(--color-accent)]">found.</span>
      </h1>
      <p className="mt-6 max-w-md text-balance text-[var(--color-foreground-secondary)]">
        The page you're looking for has either drifted out of memory or never existed in the first
        place.
      </p>
      <div className="mt-12">
        <Link
          href="/"
          className="rounded-full bg-[var(--color-foreground)] px-8 py-4 text-sm font-medium text-[var(--color-bg)] transition-opacity hover:opacity-80"
        >
          Back to start
        </Link>
      </div>
    </main>
  );
}
