import Link from "next/link";
import { listAllScenes } from "@/lib/scenes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My memories — Living Photos",
};

export default function DashboardPage() {
  const scenes = listAllScenes();
  return (
    <main className="relative z-10 mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10 flex items-baseline justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            My memories
          </p>
          <h1 className="text-3xl font-light tracking-tight">All of yours, in one place.</h1>
        </div>
        <Link
          href="/create"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          + New memory
        </Link>
      </div>

      {scenes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <p className="mb-3 text-lg">No memories yet.</p>
          <p className="mb-6 text-muted-foreground">Upload your first photo to step inside it.</p>
          <Link
            href="/create"
            className="inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Start with a photo
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {scenes.map((s) => (
            <li
              key={s.id}
              className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground"
            >
              <Link href={`/scene/${s.slug}`}>
                {/* biome-ignore lint/performance/noImgElement: not user-facing perf path */}
                <img
                  src={s.sourcePhotoUrl}
                  alt={s.title}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-4">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {statusLabel(s.status)}
                    {s.paid ? " · Unlocked" : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
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
