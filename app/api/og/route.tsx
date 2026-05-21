/* eslint-disable react/no-unknown-property */
import { ImageResponse } from "@vercel/og";
import { getSceneBySlug } from "@/lib/scenes";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return new Response("missing slug", { status: 400 });
  const scene = getSceneBySlug(slug);
  if (!scene) return new Response("not found", { status: 404 });

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 80,
        background: `linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.85) 100%), url(${scene.sourcePhotoUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ fontSize: 28, opacity: 0.7, margin: 0, letterSpacing: 4 }}>LIVING PHOTOS</p>
      <h1 style={{ fontSize: 72, fontWeight: 300, margin: 0, lineHeight: 1.1 }}>{scene.title}</h1>
      <p style={{ fontSize: 28, opacity: 0.85, marginTop: 12 }}>Step inside this memory.</p>
    </div>,
    { width: 1200, height: 630 },
  );
}
