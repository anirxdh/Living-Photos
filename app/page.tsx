import { CTA } from "@/components/landing/cta";
import { Emotional } from "@/components/landing/emotional";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LiveProof } from "@/components/landing/live-proof";
import { Nav } from "@/components/landing/nav";
import { Pricing } from "@/components/landing/pricing";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <Hero />
        <LiveProof />
        <HowItWorks />
        <Emotional />
        <Pricing />
        <FAQ />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
