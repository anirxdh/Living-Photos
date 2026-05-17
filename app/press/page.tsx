import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";

export const metadata = {
  title: "Press kit — Living Photos",
};

const STACK = [
  ["World Labs Marble 1.1", "Photo → 3D Gaussian splat environment"],
  ["FAL Hunyuan3D", "Per-object 3D meshes with PBR textures"],
  ["ElevenLabs Sound Effects", "Ambient room audio"],
  ["ElevenLabs Instant Voice Cloning", "Clone a voice from a 30-second sample"],
  ["Stripe Checkout + Billing", "$15 one-time + usage-billed future tiers"],
  ["Three.js + React Three Fiber + Spark.js", "Splat rendering, walkable controls, mobile WebGL2"],
  ["Inngest", "Orchestrates the 5-minute background pipeline"],
];

const PRICING = [
  ["Single memory", "$15 one-time"],
  ["Family unlimited", "$49 / year (V1.5)"],
  ["Lifetime archive", "$299 one-time (V1.5)"],
];

export default function PressPage() {
  return (
    <>
      <Nav />
      <main className="relative min-h-screen pt-32">
        <div className="mx-auto max-w-3xl px-6 pb-24">
          <Eyebrow className="mb-4">Press kit</Eyebrow>
          <Headline size="card" as="h1">
            Living Photos
          </Headline>

          <Section title="One-liner">
            <p>
              Turn one photograph into a walkable 3D scene with the voice of someone you loved
              playing softly inside. Preserved forever for $15.
            </p>
          </Section>

          <Section title="Tagline">
            <p>Step inside a memory.</p>
          </Section>

          <Section title="The problem">
            <p>
              Photos flatten the moments that matter most. The kitchen where grandma baked exists as
              a 4×6 print and nothing more. Voices fade from memory. Children grow up far from
              grandparents. There has been no way to <em>enter</em> the space of a memory you can't
              return to — until generative 3D and voice cloning matured at the same time.
            </p>
          </Section>

          <Section title="The product">
            <p>
              One photo upload → ~5 minutes later, a walkable 3D Gaussian-splat reconstruction of
              the room with ambient sound, optional voice-cloned narration, and a public share URL
              that opens on any phone.
            </p>
          </Section>

          <Section title="What's under the hood">
            <ul className="space-y-3 text-[var(--color-foreground-secondary)]">
              {STACK.map(([k, v]) => (
                <li key={k} className="grid gap-1 md:grid-cols-[260px_1fr]">
                  <strong className="text-[var(--color-foreground)]">{k}</strong>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Voice consent — by design">
            <p>
              No voice clone is ever created without a live-attestation recording where the named
              person reads a phrase containing a server-issued nonce. Public-figure denylist
              prevents celebrity cloning. Every voice can be revoked from the dashboard, which
              deletes upstream from ElevenLabs.
            </p>
          </Section>

          <Section title="Pricing">
            <table className="w-full">
              <tbody className="divide-y divide-[var(--color-border)]">
                {PRICING.map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-3 pr-4 text-[var(--color-foreground)]">{k}</td>
                    <td className="py-3 text-[var(--color-foreground-secondary)]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Hackathon">
            <p>
              Built for the <strong>Stripe + ElevenLabs</strong> hackathon, May 2026.
              <br />
              Tags: <code className="text-[var(--color-accent)]">@stripe</code> ·{" "}
              <code className="text-[var(--color-accent)]">@elevenlabsio</code> ·{" "}
              <code className="text-[var(--color-accent)]">#ElevenHacks</code>
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16 border-t border-[var(--color-border)] pt-10">
      <h2 className="eyebrow mb-4">{title}</h2>
      <div className="prose prose-invert max-w-none text-[var(--color-foreground-secondary)]">
        {children}
      </div>
    </section>
  );
}
