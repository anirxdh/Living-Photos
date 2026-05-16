# 60-second demo script

> Goal: stop-the-scroll. The viewer should think "wait, this just happened to a real person."

## Cast & props

- An **interior photo** of personal significance (grandparent's kitchen, childhood bedroom, late relative's living room). Pre-rendered ahead of time as a backup.
- A **voice sample** of someone the audience can recognize as emotionally loaded (founder's parent, grandparent voicemail, etc.) — **with documented consent**.
- A second phone for the "share with mom" reveal at second 50.

## Cuts

**0:00–0:03 — Hook (one sentence on screen, bold)**
> "I uploaded a photo of my grandma's kitchen. She passed in 2019."

Photo on full screen.

**0:03–0:08 — Setup**
The `/create` page, photo dragged in, title typed: "Grandma's kitchen, 1995".

**0:08–0:18 — Generation reveal**
Time-lapse of progress UI:
- "Submitting to Marble…"
- "Extracting depth…"
- "Building meshes…"
- "Generating ambient sound…"
- "Cloning voice…" *(this beat sells the product)*
- "Ready."

In live demo, MOCK_MODE makes this <5s. In the recorded video, compress real 4-5min into 10s of timelapse.

**0:18–0:32 — Walking in**
Viewer loads. Founder drags the camera left, right, forward. The voice plays softly:
> *"Sweetheart, dinner's almost ready. Wash up."*

Hold on the founder's face. Don't speak.

**0:32–0:42 — The reveal that makes it shareable**
Cut to phone: founder DMs mom the share link. Mom opens it on her phone. We see *her* face on a second camera. She breaks.

**0:42–0:52 — Payment moment**
Quick cut: the `Unlock memory — $19` button → Stripe Checkout → green checkmark → "Your memory is saved."

**0:52–0:60 — CTA**
End frame:
> Living Photos. Step inside a memory. **livingphotos.app** *(or your demo URL)*
> Built with @stripe + @elevenlabsio  #ElevenHacks

## Backup if the live demo dies

1. Three pre-rendered scenes published at stable share URLs (record their slugs in `docs/demo-scenes.md`).
2. The MP4 recording lives in `public/demo/submission.mp4` — play it inline if anything goes wrong.
3. The submission video on YouTube unlisted as a final safety.

## Pre-flight checklist

- [ ] `.env.local` has all real keys (`MOCK_MODE=false`)
- [ ] Stripe is in test mode but with **publish-ready test card** (`4242 4242 4242 4242`)
- [ ] Three demo scenes pre-rendered and bookmarked
- [ ] Submission video uploaded
- [ ] Venue wifi tested — viewer loads in <5s on the venue connection
- [ ] Consent artifacts on file for every cloned voice in the demo
- [ ] Phone for share-link demo charged
- [ ] Backup hotspot
- [ ] Demo machine has `pnpm dev` AND `pnpm dev:inngest` AND `stripe listen` all running
- [ ] CI green on `main`
