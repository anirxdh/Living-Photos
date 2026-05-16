import Link from "next/link";
import { notFound } from "next/navigation";
import { getSceneBySlug } from "@/lib/scenes";
import SceneClient from "./scene-client";

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
      images: [scene.sourcePhotoUrl],
    },
  };
}

export default async function ScenePage({ params }: PageProps) {
  const { slug } = await params;
  const scene = getSceneBySlug(slug);
  if (!scene) notFound();
  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← My memories
        </Link>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{scene.status}</p>
      </div>
      <h1 className="mb-1 text-3xl font-light tracking-tight">{scene.title}</h1>
      {scene.description && <p className="mb-6 text-muted-foreground">{scene.description}</p>}
      <SceneClient scene={scene} />
    </main>
  );
}
