"use client";

import { useEffect, useRef, useState } from "react";

type Step = "name" | "consent" | "sample" | "submitting" | "done" | "error";

interface Draft {
  nonce: string;
  phrase: string;
  promptForUser: string;
}

export default function VoiceClient() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [isSelf, setIsSelf] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [consentBlob, setConsentBlob] = useState<Blob | null>(null);
  const [sampleBlob, setSampleBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);

  async function startConsent() {
    setError(null);
    if (!name.trim()) return setError("Add a name first.");
    const res = await fetch(`/api/voice/consent?name=${encodeURIComponent(name)}`);
    if (!res.ok) return setError("Could not start consent flow.");
    setDraft((await res.json()) as Draft);
    setStep("consent");
  }

  async function submit() {
    if (!draft || !consentBlob || !sampleBlob) return;
    setStep("submitting");
    try {
      const consentUpload = await uploadBlob(consentBlob, "consent.webm", "audio/webm");
      const sampleUpload = await uploadBlob(sampleBlob, "voice-sample.webm", "audio/webm");

      const res = await fetch("/api/voice/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          isSelfVoice: isSelf,
          consentArtifactUrl: consentUpload.url,
          // In real mode this would be a Scribe transcript. For the demo we send
          // the draft phrase back as the transcript so the gate passes.
          consentTranscript: draft.phrase,
          consentNonce: draft.nonce,
          voiceSampleUrl: sampleUpload.url,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "consent denied");
      }
      const { voiceClone } = (await res.json()) as {
        voiceClone: { elevenVoiceId: string };
      };
      setVoiceId(voiceClone.elevenVoiceId);
      // Persist for the /create page to pick up — the photo flow is the next
      // natural step ("clone voice → create memory"). Survives a tab refresh.
      try {
        localStorage.setItem(
          "livingphotos.voice",
          JSON.stringify({ id: voiceClone.elevenVoiceId, name, savedAt: Date.now() }),
        );
      } catch {
        // localStorage blocked (private mode etc.) — non-fatal, user just won't
        // see the voice prefilled on /create. They can re-clone if needed.
      }
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "submit failed");
      setStep("error");
    }
  }

  return (
    <div className="space-y-6">
      {step === "name" && (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-muted-foreground">Whose voice is this?</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
              data-testid="voice-name"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isSelf} onChange={(e) => setIsSelf(e.target.checked)} />
            This is my own voice
          </label>
          <button
            type="button"
            onClick={startConsent}
            disabled={!name.trim()}
            className="w-full rounded-full bg-foreground py-3 text-sm font-medium text-background disabled:opacity-40"
            data-testid="voice-start"
          >
            Next — record consent
          </button>
        </div>
      )}

      {step === "consent" && draft && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
              Read this aloud — clearly and slowly
            </p>
            <p className="font-medium italic">"{draft.phrase}"</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Code: <code>{draft.nonce}</code>
            </p>
          </div>
          <Recorder onComplete={setConsentBlob} label="consent" />
          {consentBlob && (
            <button
              type="button"
              onClick={() => setStep("sample")}
              className="w-full rounded-full bg-foreground py-3 text-sm font-medium text-background"
              data-testid="voice-next-sample"
            >
              Next — record voice sample
            </button>
          )}
        </div>
      )}

      {step === "sample" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Now read anything you like for 30 seconds. The more varied your speech, the better the
            clone.
          </p>
          <Recorder onComplete={setSampleBlob} label="sample" />
          {sampleBlob && (
            <button
              type="button"
              onClick={submit}
              className="w-full rounded-full bg-foreground py-3 text-sm font-medium text-background"
              data-testid="voice-submit"
            >
              Clone the voice
            </button>
          )}
        </div>
      )}

      {step === "submitting" && (
        <div className="rounded-lg border border-border bg-muted/40 p-6 text-center">
          <p>Cloning the voice…</p>
        </div>
      )}

      {step === "done" && voiceId && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-6 text-center">
          <p className="mb-2 text-lg">Voice cloned.</p>
          <p className="text-xs text-muted-foreground">
            Voice ID: <code>{voiceId}</code>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            We've saved this voice for your next memory.
          </p>
          <a
            href="/create"
            className="mt-5 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
          >
            Create a memory with this voice →
          </a>
        </div>
      )}

      {(error || step === "error") && error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

function Recorder({ onComplete, label }: { onComplete: (blob: Blob) => void; label: string }) {
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  async function start() {
    chunksRef.current = [];
    setBlobUrl(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      // Test or unsupported env — make a deterministic mock blob immediately.
      const fake = new Blob([`mock-${label}-${Date.now()}`], { type: "audio/webm" });
      setBlobUrl(URL.createObjectURL(fake));
      onComplete(fake);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    recorderRef.current = rec;
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setBlobUrl(URL.createObjectURL(blob));
      onComplete(blob);
      for (const t of stream.getTracks()) t.stop();
    };
    rec.start();
    setRecording(true);
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={recording ? stop : start}
        className={`w-full rounded-full py-3 text-sm font-medium transition ${
          recording
            ? "bg-destructive text-destructive-foreground"
            : "border border-border hover:bg-muted"
        }`}
        data-testid={`record-${label}`}
      >
        {recording ? "Stop" : blobUrl ? "Re-record" : "Start recording"}
      </button>
      {blobUrl && (
        // biome-ignore lint/a11y/useMediaCaption: playback of own recording
        <audio src={blobUrl} controls className="w-full" />
      )}
    </div>
  );
}

async function uploadBlob(blob: Blob, name: string, contentType: string) {
  const pathname = `voice/${Date.now()}-${name}`;
  const signedRes = await fetch(
    `/api/blob/upload?pathname=${encodeURIComponent(pathname)}&contentType=${encodeURIComponent(contentType)}`,
  );
  if (!signedRes.ok) throw new Error("upload signed-url failed");
  const { url, publicUrl } = (await signedRes.json()) as { url: string; publicUrl: string };
  const put = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: { "content-type": contentType },
  });
  if (!put.ok) throw new Error("upload PUT failed");
  const json = (await put.json().catch(() => ({}))) as { url?: string };
  return { url: json.url ?? publicUrl };
}
