import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";
import { listAllScenes } from "@/lib/scenes";

export const dynamic = "force-dynamic";

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
              {scenes.map((s) => (
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
                        className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                      />
                      <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, transparent 50%, rgba(10,10,11,0.85) 100%)",
                        }}
                      />
                    </div>
                    <div className="p-5">
                      <p className="font-serif text-xl text-[var(--color-foreground)] italic">
                        {s.title}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-foreground-muted)]">
                        {statusLabel(s.status)}
                        {s.paid ? " · Unlocked" : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
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
