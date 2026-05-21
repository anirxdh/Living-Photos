import { NextResponse } from "next/server";
import { z } from "zod";
import { startCheckout } from "@/lib/payments";

export const runtime = "nodejs";

const Body = z.object({
  sceneId: z.string().min(1),
  userEmail: z.string().email().optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  try {
    const out = await startCheckout(parsed.data);
    if ("alreadyPaid" in out && out.alreadyPaid) {
      return NextResponse.json({ alreadyPaid: true, sceneId: out.sceneId });
    }
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
