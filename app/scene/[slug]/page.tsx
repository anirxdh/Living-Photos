import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
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
    <>
      <Nav />
      <main className="relative min-h-screen pt-32">
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-sm text-[var(--color-foreground-secondary)] transition-colors hover:text-[var(--color-foreground)]"
            >
              ← My memories
            </Link>
            <p className="eyebrow">{scene.status}</p>
          </div>
          <h1 className="headline text-[clamp(40px,5vw,72px)] text-[var(--color-foreground)]">
            {scene.title}
          </h1>
          {scene.description && (
            <p className="mt-4 max-w-xl text-[var(--color-foreground-secondary)]">
              {scene.description}
            </p>
          )}
          <div className="mt-10">
            <SceneClient scene={scene} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
