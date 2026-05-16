import VoiceClient from "./voice-client";

export const metadata = {
  title: "Add a voice — Living Photos",
};

export default function VoicePage() {
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-6 py-16">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Voice clone</p>
      <h1 className="mb-2 text-3xl font-light tracking-tight">Hear them speak again.</h1>
      <p className="mb-8 text-muted-foreground">
        Record a short consent statement, then upload a clean 30-second voice sample. We'll clone it
        so the room can speak in their voice.
      </p>
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
        <strong>Consent matters.</strong> If the voice isn't yours, the person you're cloning must
        read the attestation phrase on the recording. We can't proceed without it.
      </div>
      <div className="mt-8">
        <VoiceClient />
      </div>
    </main>
  );
}
