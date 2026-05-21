import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";
import { PRICE_DISPLAY } from "@/lib/pricing";
import { listAllScenes } from "@/lib/scenes";

/** Inline lock icon — avoid adding lucide-react just for one glyph. */
function Lock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export const metadata = {
  title: "My memories — Living Photos",
};

export default function DashboardPage() {
  const scenes = listAllScenes();
  return (
    <>
      <Nav />
      <main className="relative min-h-screen pt-32">
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow className="mb-4">My memories</Eyebrow>
              <Headline size="card" as="h1">
                All of yours,{" "}
                <span className="italic text-[var(--color-foreground-secondary)]">
                  in one place.
                </span>
              </Headline>
            </div>
            <Button href="/create" size="md" variant="primary">
              + New memory
            </Button>
          </div>

          {scenes.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-8 py-24 text-center">
              <p className="headline text-3xl text-[var(--color-foreground)]">Nothing here yet.</p>
              <p className="mt-4 text-[var(--color-foreground-secondary)]">
                Upload your first photo to step inside it.
              </p>
              <div className="mt-10">
                <Button href="/create" size="md" variant="primary">
                  Start with a photo
                </Button>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {scenes.map((s) => {
                const isLocked = s.status === "ready" && !s.paid;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/scene/${s.slug}`}
                      className="group block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-elevated)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {/* biome-ignore lint/performance/noImgElement: not optimizing user uploads */}
                        <img
                          src={s.sourcePhotoUrl}
                          alt={s.title}
                          className={`h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 ${
                            isLocked ? "blur-md scale-110" : ""
                          }`}
                        />
                        <div
                          aria-hidden
                          className="absolute inset-0"
                          style={{
                            background: isLocked
                              ? "linear-gradient(180deg, rgba(10,10,11,0.35) 0%, rgba(10,10,11,0.75) 100%)"
                              : "linear-gradient(180deg, transparent 50%, rgba(10,10,11,0.85) 100%)",
                          }}
                        />

                        {/* Lock badge in top-right corner for locked scenes */}
                        {isLocked && (
                          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                            <Lock className="h-3 w-3" />
                            Locked
                          </div>
                        )}

                        {/* Centered unlock prompt overlay for locked scenes */}
                        {isLocked && (
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/30">
                              <Lock className="h-5 w-5 text-white" />
                            </div>
                            <p className="mt-4 font-serif text-lg italic text-white drop-shadow-lg">
                              Unlock to step inside
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/85 drop-shadow">
                              {PRICE_DISPLAY} · one-time
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="font-serif text-xl text-[var(--color-foreground)] italic">
                          {s.title}
                        </p>
                        <p className="mt-2 text-xs text-[var(--color-foreground-muted)]">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1.5 text-[var(--color-accent)]">
                              <Lock className="h-3 w-3" />
                              Unlock for {PRICE_DISPLAY}
                            </span>
                          ) : (
                            <>
                              {statusLabel(s.status)}
                              {s.paid ? " · Unlocked" : ""}
                            </>
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "generating":
      return "Building your scene…";
    case "ready":
      return "Ready to step inside";
    case "failed":
      return "Generation failed";
    default:
      return status;
  }
}
