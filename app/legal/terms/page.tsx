import Link from "next/link";

export const metadata = { title: "Terms — Living Photos" };

export default function TermsPage() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 py-16 text-sm leading-7 text-muted-foreground">
      <h1 className="mb-6 text-3xl font-light tracking-tight text-foreground">Terms of Service</h1>
      <p className="mb-4">
        These terms govern your use of Living Photos. By creating a scene you agree to:
      </p>
      <ul className="mb-6 list-disc space-y-2 pl-5">
        <li>Only upload photographs you own or have explicit permission to upload.</li>
        <li>
          Only clone voices that are your own, or for which you have documented consent from the
          owner (validated by the live-attestation flow).
        </li>
        <li>
          Not depict minors without parental consent, and not create scenes of public figures or
          celebrities.
        </li>
        <li>
          Not use Living Photos for deception, fraud, harassment, or any other unlawful purpose.
        </li>
      </ul>
      <p className="mb-4">
        We may remove any scene that violates these terms with or without notice. Payments are
        non-refundable once a scene has been generated.
      </p>
      <p>
        <Link href="/" className="underline hover:text-foreground">
          ← Back home
        </Link>
      </p>
    </main>
  );
}
