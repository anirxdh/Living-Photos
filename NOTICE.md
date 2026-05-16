# NOTICE

Living Photos is © 2026 Anirudh Vasudevan — see [LICENSE](./LICENSE) for terms.

This product includes software developed by third parties. Their licenses are
preserved below.

---

## image-blaster (MIT)

Portions of `lib/image-blaster/marble.ts`, `lib/image-blaster/fal.ts`, and
`lib/image-blaster/sfx.ts` are derived from the open-source project
**image-blaster** by Neilson Koerner-Safrata
(https://github.com/neilsonnn/image-blaster).

Specifically: the World Labs Marble API request shape, the FAL queue
submit/poll/result protocol, and the ElevenLabs Sound Effects + Instant Voice
Cloning request bodies were translated from the upstream `.mjs` scripts at:

- `vendor/image-blaster/.claude/scripts/world/generate-world.mjs`
- `vendor/image-blaster/.claude/scripts/asset-pipeline/fal-queue.mjs`
- `vendor/image-blaster/.claude/scripts/asset-pipeline/hunyuan-3d.mjs`
- `vendor/image-blaster/.claude/scripts/sfx/fal-elevenlabs-sfx.mjs`

These portions remain subject to the MIT License reproduced below.

```
MIT License

Copyright (c) 2025 Neilson Koerner-Safrata

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Upstream service trademarks

The product orchestrates the following third-party APIs. All trademarks and
service marks are property of their respective owners. Living Photos is not
affiliated with, endorsed by, or sponsored by any of them.

- **World Labs** — Marble world generation
- **fal.ai** — Hunyuan3D, ElevenLabs SFX proxy
- **Tencent** — Hunyuan3D model
- **ElevenLabs** — Instant Voice Cloning, Text-to-Speech, Sound Effects
- **Stripe** — Payments
- **Vercel** — Hosting, Blob storage
- **Inngest** — Background job orchestration
- **Neon** — Postgres
- **Resend** — Transactional email
- **Sentry** — Error tracking
- **Hedra** — Character-3 talking avatars (V3 roadmap, adapter stub only)

---

## Open-source npm dependencies

Direct npm dependencies and their licenses (transitive packages have their
own license metadata available via `pnpm licenses list`).

- next, react, react-dom — MIT
- three, @react-three/fiber, @react-three/drei — MIT
- drizzle-orm, drizzle-kit — Apache-2.0
- @neondatabase/serverless — Apache-2.0
- inngest — Apache-2.0
- stripe — MIT
- @vercel/blob, @vercel/og — Apache-2.0
- nanoid, clsx, tailwind-merge, zod, react-dropzone — MIT
- tailwindcss, @tailwindcss/postcss — MIT
- @biomejs/biome — MIT/Apache-2.0
- typescript — Apache-2.0
- vitest, @playwright/test — MIT
- tsx — MIT
