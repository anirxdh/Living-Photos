import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    status: "ok",
    mockMode: env.MOCK_MODE,
    timestamp: new Date().toISOString(),
  });
}
