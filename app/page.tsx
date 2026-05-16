import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative z-10">
      {/* Hero */}
      <section className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Living Photos
        </p>
        <h1 className="mb-6 text-5xl font-light leading-tight tracking-tight md:text-7xl">
          Step inside <br /> a memory.
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
          Built with ElevenLabs · Stripe · World Labs Marble · FAL Hunyuan3D
        </p>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/20 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Three steps
          </p>
          <h2 className="mb-16 text-center text-3xl font-light tracking-tight md:text-4xl">
            Five minutes from photo to walkable scene.
          </h2>
          <div className="grid gap-12 md:grid-cols-3">
            <Step
              n="01"
              title="Upload one photo"
              body="Drag a photo of an interior — a kitchen, a bedroom, a porch. JPG, PNG, or WEBP."
            />
            <Step
              n="02"
              title="We rebuild it in 3D"
              body="World Labs Marble + FAL Hunyuan3D reconstruct the room. ElevenLabs fills in the ambient sound."
            />
            <Step
              n="03"
              title="Walk in. Hear them speak."
              body="Optional: upload a loved one's voice. Their cloned voice plays softly as you explore."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-6 text-center text-xs text-muted-foreground">
          <p>Living Photos · A Stripe + ElevenLabs hackathon submission, May 2026</p>
          <p>
            <Link href="/press" className="underline hover:text-foreground">
              Press kit
            </Link>
            {" · "}
            <Link href="/legal/terms" className="underline hover:text-foreground">
              Terms
            </Link>
            {" · "}
            <Link href="/legal/privacy" className="underline hover:text-foreground">
              Privacy
            </Link>
            {" · "}
            <Link href="/legal/aup" className="underline hover:text-foreground">
              Acceptable Use
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="mb-3 text-sm font-mono text-muted-foreground">{n}</p>
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
