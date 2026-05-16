import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">Living Photos</p>
      <h1 className="mb-6 text-5xl font-light leading-tight tracking-tight md:text-6xl">
        Step inside a memory.
      </h1>
      <p className="mb-10 max-w-xl text-balance text-lg text-muted-foreground">
        Upload one old photograph. Walk through it in 3D, with the voice of someone you loved
        playing softly from inside the room. Preserved forever.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/create"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90"
        >
          Bring a memory to life — $19
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          My memories
        </Link>
      </div>
      <p className="mt-12 text-xs text-muted-foreground">
        Built with ElevenLabs, Stripe, World Labs Marble, and FAL Hunyuan3D.
      </p>
    </main>
  );
}
