# Architecture (concise)

## Data flow

```
USER UPLOAD
    │
    ▼
/api/blob/upload  ── signed URL ──▶  Vercel Blob (mock or real)
    │
    ▼
POST /api/scenes      (insert + Inngest event)
    │
    ▼
inngest:scene/uploaded ──▶  scene-generate function
                                  │
                                  ├─ submit-marble       ── Marble (mock|real)
                                  ├─ wait-marble         ── poll / webhook
                                  ├─ detect-objects      ── (stub today; SAM2 later)
                                  ├─ mesh-objects (∥)    ── FAL Hunyuan3D
                                  ├─ generate-sfx        ── ElevenLabs SFX
                                  ├─ generate-narration? ── ElevenLabs IVC + TTS
                                  └─ publish             ── flip scene.ready = true
USER PAYMENT
    │
    ▼
POST /api/stripe/checkout      ── Checkout session (sceneId in metadata)
    │
    ▼
Stripe-hosted page
    │
    ▼
checkout.session.completed
    │
    ├──▶ /api/webhooks/stripe   ── verify signature, dedupe by event_id, flip scene.paid
    │
    └──▶ /scene/<slug>/success  ── redirect; in MOCK_MODE the client also POSTs
                                    /api/stripe/mock-fulfill to simulate the webhook
```

## Adapter pattern

```
                ┌── MockAdapter (deterministic, no network)
Interface ──────┤
                └── RealAdapter (fetch / SDK)

env.MOCK_MODE ──▶ factory() ──▶ Adapters bag ──▶ called from any service / route
```

Contract tests parameterize both implementations against the same assertions.

## Idempotency

Stripe webhook deliveries are deduped at the floor:

```
processed_webhook_events
  UNIQUE (provider, event_id)

INSERT … ON CONFLICT DO NOTHING
  → if rowcount == 1 we mutate scene state
  → if rowcount == 0 we return 200 silently
```

`fulfillCheckoutEvent` returns `{ mutated: true | false, reason }` so the caller can log without surfacing duplicates as errors.

## Voice consent gate

```
buildConsentDraft(name) ──▶ { nonce, phrase, promptForUser }
                              ▲
                              │ user reads aloud
                              │
recording.webm  ──▶ Scribe ──▶ consentTranscript
                              │
                              ▼
createConsentedVoiceClone(...) ──▶ throws ConsentError if:
                                    - nonce missing from transcript
                                    - name missing from transcript
                                    - name in denylist
                                  else ──▶ adapters().voice.cloneVoice() ──▶ row with consent_verified_at
```

No IVC call is reachable until the consent row has `consent_verified_at != null`.

## What's intentionally minimal

- Auth is deferred (anonymous scenes claimable later via Stripe Checkout email)
- Inngest realtime UI is polling-based today (`useEffect` setInterval); a fully realtime hook lands when we wire `useInngestSubscription`
- `detect-objects` is a fixture stub; SAM2 / YOLO integration comes with real-adapter swap
- Person inpainting (for V3 Hedra avatar overlay) is documented but not wired
- Hedra Character-3 talking avatars are explicit V3, out of hackathon scope
