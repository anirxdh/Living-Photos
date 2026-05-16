import Link from "next/link";

export const metadata = {
  title: "Press kit — Living Photos",
};

export default function PressPage() {
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-6 py-16">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Press kit</p>
      <h1 className="mb-8 text-3xl font-light tracking-tight">Living Photos</h1>

      <section className="mb-10">
        <h2 className="mb-2 text-lg font-medium">One-liner</h2>
        <p className="text-muted-foreground">
          Turn one photograph into a walkable 3D scene with the voice of someone you loved playing
          softly inside. Preserved forever for $19.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-lg font-medium">Tagline</h2>
        <p className="text-muted-foreground">Step inside a memory.</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-lg font-medium">The problem</h2>
        <p className="text-muted-foreground">
          Photos flatten the moments that matter most. The kitchen where grandma baked exists as a
          4×6 print and nothing more. Voices fade from memory. Children grow up far from
          grandparents. There has been no way to *enter* the space of a memory you can't return to —
          until generative 3D and voice cloning matured at the same time.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-lg font-medium">The product</h2>
        <p className="text-muted-foreground">
          One photo upload → ~5 minutes later, a walkable 3D Gaussian-splat reconstruction of the
          room with ambient sound, optional voice-cloned narration, and a public share URL that
          opens on any phone.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-lg font-medium">What's under the hood</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong>World Labs Marble 1.1</strong> — photo → 3D Gaussian splat environment
          </li>
          <li>
            <strong>FAL Hunyuan3D</strong> — per-object 3D meshes with PBR textures
          </li>
          <li>
            <strong>ElevenLabs Sound Effects</strong> — ambient room audio
          </li>
          <li>
            <strong>ElevenLabs Instant Voice Cloning</strong> — clone any voice (with consent) in
            seconds
          </li>
          <li>
            <strong>Stripe Checkout + Billing Meters</strong> — $19 one-time + usage-billed future
            tiers
          </li>
          <li>
            <strong>Three.js + React Three Fiber</strong> — splat rendering, walkable cone controls,
            mobile WebGL2
          </li>
          <li>
            <strong>Inngest</strong> — orchestrates the 5-minute background pipeline with webhook
            resumption
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-lg font-medium">Voice consent — by design</h2>
        <p className="text-muted-foreground">
          No voice clone is ever created without a live-attestation recording where the named person
          reads a phrase containing a server-issued nonce. Public-figure denylist prevents celebrity
          cloning. Every voice can be revoked from the dashboard, which deletes upstream from
          ElevenLabs.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-lg font-medium">Pricing</h2>
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-border">
            <tr>
              <td className="py-2 pr-4">Single memory</td>
              <td className="py-2 text-muted-foreground">$19 one-time</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Family unlimited</td>
              <td className="py-2 text-muted-foreground">$49 / year (V1.5)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Lifetime archive</td>
              <td className="py-2 text-muted-foreground">$299 one-time (V1.5)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-lg font-medium">Hackathon</h2>
        <p className="text-muted-foreground">
          Built for the <strong>Stripe + ElevenLabs</strong> hackathon, May 2026.
          <br />
          Tags: <code>@stripe</code> · <code>@elevenlabsio</code> · <code>#ElevenHacks</code>
        </p>
      </section>

      <p className="mt-12">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Back home
        </Link>
      </p>
    </main>
  );
}
