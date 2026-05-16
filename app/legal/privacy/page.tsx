import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";

export const metadata = { title: "Privacy — Living Photos" };

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="relative min-h-screen pt-32">
        <div className="mx-auto max-w-2xl px-6 pb-24">
          <Eyebrow className="mb-4">Legal</Eyebrow>
          <Headline size="card" as="h1">
            Privacy
          </Headline>
          <div className="mt-10 space-y-6 text-[var(--color-foreground-secondary)]">
            <p>We collect the minimum data needed to deliver the product:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Uploaded photographs and generated 3D assets (Vercel Blob).</li>
              <li>Voice samples and consent recordings — kept only as long as needed.</li>
              <li>Email address for receipts and scene-ready notifications.</li>
              <li>Stripe handles all payment details; we never store card information.</li>
            </ul>
            <p>
              You can delete any scene, voice clone, or your entire account at any time from the
              dashboard. Deletion is propagated to ElevenLabs and our storage within minutes.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
