import Link from "next/link";

export const metadata = { title: "Acceptable Use — Living Photos" };

export default function AupPage() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 py-16 text-sm leading-7 text-muted-foreground">
      <h1 className="mb-6 text-3xl font-light tracking-tight text-foreground">Acceptable Use</h1>
      <p className="mb-4">Living Photos is built for memory and connection. It is not for:</p>
      <ul className="mb-6 list-disc space-y-2 pl-5">
        <li>
          Cloning the voices of public figures, celebrities, or anyone who has not given documented
          consent.
        </li>
        <li>Sexual or violent content involving real, identifiable people.</li>
        <li>Content depicting minors in any sexual or suggestive context.</li>
        <li>Impersonation for fraud, scams, harassment, or political manipulation.</li>
        <li>Anything illegal in your jurisdiction or the United States.</li>
      </ul>
      <p className="mb-4">
        Report a scene via the "Report" button on any share page. Verified violations are removed
        within one hour. DMCA notices may be sent to{" "}
        <a href="mailto:dmca@livingphotos.app" className="underline hover:text-foreground">
          dmca@livingphotos.app
        </a>
        .
      </p>
      <p>
        <Link href="/" className="underline hover:text-foreground">
          ← Back home
        </Link>
      </p>
    </main>
  );
}
