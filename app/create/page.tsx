import { Footer } from "@/components/landing/footer";
import { Nav } from "@/components/landing/nav";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Headline } from "@/components/ui/headline";
import { WaitlistBanner } from "@/components/waitlist-banner";
import CreateClient from "./create-client";

export const metadata = {
  title: "Create a memory — Living Photos",
  description: "Upload a photo to bring a memory to life.",
};

export default function CreatePage() {
  return (
    <>
      <Nav />
      <main className="relative min-h-screen pt-32">
        <div className="mx-auto max-w-2xl px-6 pb-20">
          <Eyebrow className="mb-4">New memory</Eyebrow>
          <Headline size="card" as="h1">
            Step inside a moment.
          </Headline>
          <p className="mt-6 max-w-md text-[var(--color-foreground-secondary)]">
            Upload one interior photo — a kitchen, a porch, a bedroom. We'll turn it into a walkable
            scene in about five minutes.
          </p>
          <div className="mt-12">
            <WaitlistBanner />
            <CreateClient />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
