/**
 * Public share alias for /scene/[slug] — same view, no auth, optimized for
 * unfurl previews (OG image set in metadata).
 */
import { notFound, redirect } from "next/navigation";
import { getSceneBySlug } from "@/lib/scenes";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const scene = getSceneBySlug(slug);
  if (!scene) return { title: "Memory not found" };
  return {
    title: `${scene.title} — Living Photos`,
    description: scene.description ?? "Step inside this memory.",
    openGraph: {
      title: scene.title,
      description: scene.description ?? "Step inside this memory.",
      images: [{ url: `/api/og?slug=${slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: scene.title,
      images: [`/api/og?slug=${slug}`],
    },
  };
}

export default async function PublicSharePage({ params }: PageProps) {
  const { slug } = await params;
  const scene = getSceneBySlug(slug);
  if (!scene) notFound();
  // Redirect to canonical viewer (paid gate still applies on /scene)
  redirect(`/scene/${slug}`);
}
