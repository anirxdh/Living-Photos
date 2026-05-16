/**
 * Inngest serve route.
 *
 * Hosts background pipeline functions. Set `maxDuration` to the max allowed
 * for our Vercel plan (we use Fluid Compute Pro = 800s) so a single step's
 * worth of work has headroom.
 */
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sceneGenerate } from "@/lib/inngest/functions/scene-generate";

export const runtime = "nodejs";
export const maxDuration = 800;
export const dynamic = "force-dynamic";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sceneGenerate],
});
