import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";

export const metadata = { title: "Terms — Living Photos" };

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="relative min-h-screen pt-32">
        <div className="mx-auto max-w-2xl px-6 pb-24">
          <Eyebrow className="mb-4">Legal</Eyebrow>
          <Headline size="card" as="h1">
            Terms of service
          </Headline>
          <div className="mt-10 space-y-6 text-[var(--color-foreground-secondary)]">
            <p>These terms govern your use of Living Photos. By creating a scene you agree to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Only upload photographs you own or have explicit permission to upload.</li>
              <li>
                Only clone voices that are your own, or for which you have documented consent from
                the owner (validated by the live-attestation flow).
              </li>
              <li>
                Not depict minors without parental consent, and not create scenes of public figures
                or celebrities.
              </li>
              <li>
                Not use Living Photos for deception, fraud, harassment, or any other unlawful
                purpose.
              </li>
            </ul>
            <p>
              We may remove any scene that violates these terms with or without notice. Payments are
              non-refundable once a scene has been generated.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
