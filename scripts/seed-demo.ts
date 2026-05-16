/**
 * Seed three demo scenes so the live demo doesn't need a fresh 5-minute upload.
 *
 * Run with: `pnpm seed`
 *
 * Posts directly to the local API, then prints the share URLs. Safe to re-run
 * (it just adds more scenes — the in-memory store resets on dev restart).
 */

const BASE = process.env.SEED_BASE_URL ?? "http://localhost:3000";

interface SeedScene {
  title: string;
  description: string;
  sourcePhotoUrl: string;
  /** If true, simulate the Stripe webhook so the scene is unlocked. */
  unlock: boolean;
  /** If true, attach a mock voice clone + narration. */
  withNarration: boolean;
}

const SCENES: SeedScene[] = [
  {
    title: "Grandma's kitchen, summer 1995",
    description:
      "She used to bake here every Sunday. The light was always exactly like this in July.",
    sourcePhotoUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
    unlock: true,
    withNarration: true,
  },
  {
    title: "My first apartment",
    description: "Brooklyn, 2018. Empty walls, big dreams.",
    sourcePhotoUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80",
    unlock: false,
    withNarration: false,
  },
  {
    title: "Dad's workshop",
    description: "Smells like sawdust and pipe tobacco. Still does, in my memory.",
    sourcePhotoUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80",
    unlock: true,
    withNarration: true,
  },
];

async function main() {
  console.info(`Seeding ${SCENES.length} demo scenes against ${BASE}…`);
  const results: Array<{ slug: string; title: string; url: string }> = [];

  for (const def of SCENES) {
    const createRes = await fetch(`${BASE}/api/scenes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourcePhotoUrl: def.sourcePhotoUrl,
        title: def.title,
        description: def.description,
      }),
    });
    if (!createRes.ok) {
      console.error("scene create failed:", await createRes.text());
      continue;
    }
    const { scene } = (await createRes.json()) as {
      scene: { id: string; slug: string };
    };

    // Wait briefly for the mock pipeline (it's <1s but be safe).
    await sleep(800);

    if (def.unlock) {
      const fulfillRes = await fetch(`${BASE}/api/stripe/mock-fulfill`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sceneId: scene.id,
          sessionId: `cs_seed_${scene.slug}`,
        }),
      });
      if (!fulfillRes.ok) console.warn("could not unlock", scene.slug);
    }

    if (def.withNarration) {
      // Attach a mock voice clone via the consent API.
      const draft = (await (await fetch(`${BASE}/api/voice/consent?name=Memory`)).json()) as {
        nonce: string;
        phrase: string;
      };
      await fetch(`${BASE}/api/voice/consent`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Memory",
          isSelfVoice: true,
          consentArtifactUrl: "https://mock.blob.local/consent/seed.webm",
          consentTranscript: draft.phrase,
          consentNonce: draft.nonce,
          voiceSampleUrl: "https://mock.blob.local/voice/seed.wav",
        }),
      });
    }

    results.push({
      slug: scene.slug,
      title: def.title,
      url: `${BASE}/s/${scene.slug}`,
    });
  }

  console.info("\n— Seeded scenes —\n");
  for (const r of results) {
    console.info(`  ${r.title}`);
    console.info(`    ${r.url}\n`);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
