import Link from "next/link";
import { notFound } from "next/navigation";
import { getSceneBySlug } from "@/lib/scenes";
import SuccessFulfill from "./success-fulfill";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string; scene_id?: string }>;
}

export default async function SuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const scene = getSceneBySlug(slug);
  if (!scene) notFound();
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
      <SuccessFulfill sceneId={scene.id} sessionId={sp.session_id ?? sp.scene_id ?? ""} />
      <div className="mb-6 text-5xl">🌿</div>
      <h1 className="mb-3 text-3xl font-light tracking-tight">Your memory is saved.</h1>
      <p className="mb-8 text-muted-foreground">Thank you. {scene.title} is yours, forever.</p>
      <Link
        href={`/scene/${scene.slug}`}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
      >
        Step inside →
      </Link>
    </main>
  );
}
