import Link from "next/link";

export const metadata = { title: "Privacy — Living Photos" };

export default function PrivacyPage() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 py-16 text-sm leading-7 text-muted-foreground">
      <h1 className="mb-6 text-3xl font-light tracking-tight text-foreground">Privacy</h1>
      <p className="mb-4">We collect the minimum data needed to deliver the product:</p>
      <ul className="mb-6 list-disc space-y-2 pl-5">
        <li>Uploaded photographs and generated 3D assets (Vercel Blob).</li>
        <li>Voice samples and consent recordings — kept only as long as needed.</li>
        <li>Email address for receipts and scene-ready notifications.</li>
        <li>Stripe handles all payment details; we never store card information.</li>
      </ul>
      <p className="mb-4">
        You can delete any scene, voice clone, or your entire account at any time from the
        dashboard. Deletion is propagated to ElevenLabs and our storage within minutes.
      </p>
      <p>
        <Link href="/" className="underline hover:text-foreground">
          ← Back home
        </Link>
      </p>
    </main>
  );
}
