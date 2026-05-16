import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";
import VoiceClient from "./voice-client";

export const metadata = {
  title: "Add a voice — Living Photos",
};

export default function VoicePage() {
  return (
    <>
      <Nav />
      <main className="relative min-h-screen pt-32">
        <div className="mx-auto max-w-2xl px-6 pb-24">
          <Eyebrow className="mb-4">Voice clone</Eyebrow>
          <Headline size="card" as="h1">
            Hear them speak{" "}
            <span className="italic text-[var(--color-foreground-secondary)]">again.</span>
          </Headline>
          <p className="mt-6 text-[var(--color-foreground-secondary)]">
            Record a short consent statement, then upload a clean 30-second voice sample. We'll
            clone it so the room can speak in their voice.
          </p>
          <div className="mt-8 rounded-[var(--radius)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-glow)] p-5 text-sm text-[var(--color-accent)]">
            <strong className="font-semibold">Consent matters.</strong> If the voice isn't yours,
            the person you're cloning must read the attestation phrase on the recording. We can't
            proceed without it.
          </div>
          <div className="mt-12">
            <VoiceClient />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
