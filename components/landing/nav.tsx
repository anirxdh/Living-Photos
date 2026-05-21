"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Nav() {
  const pathname = usePathname();
  // On the landing page, use a pure hash so Lenis smooth-scrolls in place.
  // Elsewhere (dashboard, press, etc.) use "/#" so Next.js navigates home first.
  const howItWorksHref = pathname === "/" ? "#how-it-works" : "/#how-it-works";

  // White-text-on-scroll behavior is ONLY for the landing page (which has the
  // hero video background). On every other page (dashboard, press, create…),
  // the nav sits over the cream-colored bg from the start, so we use plain
  // muted-dark text always — otherwise it'd look like faint white-on-cream.
  const isLanding = pathname === "/";

  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ["rgba(247,245,240,0)", "rgba(247,245,240,0.85)"]);
  const borderOpacity = useTransform(scrollY, [0, 120], [0, 1]);
  const blur = useTransform(scrollY, [0, 120], ["blur(0px)", "blur(20px)"]);

  // Landing-page only: nav text starts white (readable over hero video) and
  // transitions to the muted-foreground color as the cream nav background
  // fades in on scroll.
  const linkColor = useTransform(
    scrollY,
    [0, 120],
    ["rgba(255,255,255,0.92)", "rgba(120,116,105,1)"],
  );
  const logoColor = useTransform(scrollY, [0, 120], ["rgba(255,255,255,1)", "rgba(58,54,50,1)"]);
  const textShadow = useTransform(
    scrollY,
    [0, 80, 120],
    ["0 1px 12px rgba(0,0,0,0.55)", "0 1px 6px rgba(0,0,0,0.25)", "none"],
  );

  // Header bg: on non-landing pages we want a SOLID cream background from the
  // start so the dark text reads cleanly. On landing it stays transparent and
  // fades in on scroll (defined above).
  const headerBg = isLanding ? bg : "rgba(247,245,240,0.85)";
  const headerBlur = isLanding ? blur : "blur(20px)";

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        backgroundColor: headerBg,
        backdropFilter: headerBlur,
        WebkitBackdropFilter: headerBlur,
      }}
    >
      <motion.div
        style={{ opacity: isLanding ? borderOpacity : 1 }}
        className="absolute inset-x-0 bottom-0 h-px bg-[var(--color-border)]"
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="headline text-2xl">
          {isLanding ? (
            <motion.span style={{ color: logoColor, textShadow }}>Living Photos</motion.span>
          ) : (
            <span className="text-[var(--color-foreground)]">Living Photos</span>
          )}
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href={howItWorksHref} className="text-sm transition-opacity hover:opacity-100">
            {isLanding ? (
              <motion.span style={{ color: linkColor, textShadow }}>How it works</motion.span>
            ) : (
              <span className="text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] transition-colors">
                How it works
              </span>
            )}
          </Link>
          <Link href="/dashboard" className="text-sm transition-opacity hover:opacity-100">
            {isLanding ? (
              <motion.span style={{ color: linkColor, textShadow }}>My memories</motion.span>
            ) : (
              <span className="text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] transition-colors">
                My memories
              </span>
            )}
          </Link>
          <Link href="/press" className="text-sm transition-opacity hover:opacity-100">
            {isLanding ? (
              <motion.span style={{ color: linkColor, textShadow }}>Press</motion.span>
            ) : (
              <span className="text-[var(--color-foreground-secondary)] hover:text-[var(--color-foreground)] transition-colors">
                Press
              </span>
            )}
          </Link>
        </nav>
        <Button href="/create" size="sm" variant="primary">
          Bring a memory to life
        </Button>
      </div>
    </motion.header>
  );
}
