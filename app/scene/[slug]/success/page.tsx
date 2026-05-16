import { notFound } from "next/navigation";
import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
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
    <>
      <Nav />
      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <SuccessFulfill sceneId={scene.id} sessionId={sp.session_id ?? sp.scene_id ?? ""} />
        <Eyebrow className="mb-6">Saved forever</Eyebrow>
        <h1 className="headline text-[clamp(48px,7vw,96px)] text-[var(--color-foreground)]">
          Your memory is <span className="italic text-[var(--color-accent)]">yours.</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-[var(--color-foreground-secondary)]">
          {scene.title} is unlocked. Step inside whenever you want, and share the link with anyone —
          they don't need an account.
        </p>
        <div className="mt-12">
          <Button href={`/scene/${scene.slug}`} size="lg" variant="primary">
            Step inside →
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
