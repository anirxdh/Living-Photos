/**
 * Dev-only: rehydrate a Marble world (already paid-for) into a local scene
 * without re-submitting the job. Use when a previous scene's jobId was lost
 * but the .spz still exists on Marble's CDN.
 *
 *   POST /api/debug/recover-marble
 *   body: { worldId: "1c5844eb-75dd-41bd-b58d-53880345919a", title?: "..." }
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { memScenes } from "@/lib/db/memory";
import { env } from "@/lib/env";
import { createScene } from "@/lib/scenes";

export const runtime = "nodejs";

const Body = z.object({
  worldId: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  if (env.NODE_ENV === "production") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  const { worldId, title, email } = parsed.data;

  // Fetch the Marble world record via API (already paid for, just metadata)
  const res = await fetch(`https://api.worldlabs.ai/marble/v1/worlds/${worldId}`, {
    headers: { "WLT-Api-Key": env.WORLD_LABS_API_KEY },
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Marble fetch ${res.status}`, body: await res.text() },
      { status: 502 },
    );
  }
  const world = (await res.json()) as {
    display_name?: string;
    assets?: {
      splats?: { spz_urls?: { full_res?: string; "150k"?: string; "100k"?: string } };
      thumbnail_url?: string;
      caption?: string;
    };
  };

  const spzUrl = world.assets?.splats?.spz_urls?.full_res;
  if (!spzUrl) {
    return NextResponse.json({ error: "no full_res splat URL in world record" }, { status: 502 });
  }

  // Use Marble's auto-generated thumbnail as the dashboard preview. This
  // hits the same public CDN as the .spz so no auth needed on the browser side.
  const thumbnail = world.assets?.thumbnail_url ?? "https://cdn.marble.worldlabs.ai/recovered.jpg";

  const scene = createScene({
    sourcePhotoUrl: thumbnail,
    title: title ?? world.display_name ?? "Recovered memory",
    description: world.assets?.caption?.slice(0, 1500),
    anonymousEmail: email ?? "recovered@local.com",
  });

  const updated = memScenes.update(scene.id, {
    status: "ready",
    paid: true,
    spzUrl,
    spzUrlLowPoly: world.assets?.splats?.spz_urls?.["150k"] ?? null,
    generationCostCents: 0, // already paid for
    pricePaidCents: 0,
    readyAt: new Date(),
    paidAt: new Date(),
  });

  return NextResponse.json({
    scene: { id: updated?.id, slug: updated?.slug, title: updated?.title },
    sceneUrl: `${env.NEXT_PUBLIC_APP_URL}/scene/${updated?.slug}`,
  });
}
