import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";

export const metadata = { title: "Acceptable Use — Living Photos" };

export default function AupPage() {
  return (
    <>
      <Nav />
      <main className="relative min-h-screen pt-32">
        <div className="mx-auto max-w-2xl px-6 pb-24">
          <Eyebrow className="mb-4">Legal</Eyebrow>
          <Headline size="card" as="h1">
            Acceptable use
          </Headline>
          <div className="mt-10 space-y-6 text-[var(--color-foreground-secondary)]">
            <p>Living Photos is built for memory and connection. It is not for:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Cloning the voices of public figures, celebrities, or anyone who has not given
                documented consent.
              </li>
              <li>Sexual or violent content involving real, identifiable people.</li>
              <li>Content depicting minors in any sexual or suggestive context.</li>
              <li>Impersonation for fraud, scams, harassment, or political manipulation.</li>
              <li>Anything illegal in your jurisdiction or the United States.</li>
            </ul>
            <p>
              Report a scene via the "Report" button on any share page. Verified violations are
              removed within one hour. DMCA notices may be sent to{" "}
              <a
                href="mailto:anirudh.vasudevan@bankyfinance.com"
                className="text-[var(--color-accent)] underline hover:text-[var(--color-foreground)]"
              >
                anirudh.vasudevan@bankyfinance.com
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
