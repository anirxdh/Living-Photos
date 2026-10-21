/**
 * Inngest serve route.
 *
 * Hosts background pipeline functions. `maxDuration` is the max allowed on
 * the Vercel Hobby plan (300s with Fluid Compute). Vercel rejects any
 * deployment where a function asks for more than the plan allows, so 800
 * (the Pro limit) failed every build. Inngest calls this route once per
 * step, so 300s is per step, not for the whole pipeline. Raise it only if
 * the project moves to Pro.
 */
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sceneGenerate } from "@/lib/inngest/functions/scene-generate";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sceneGenerate],
});
