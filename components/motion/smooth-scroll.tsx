"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Lenis smooth-scroll provider. Wraps children at the root and runs the
 * scroll loop. Single source of truth for scroll feel — every interaction in
 * the app inherits the same buttery easing. Disabled when users prefer
 * reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Hand anchor-link clicks (e.g. <a href="#how-it-works">) to Lenis so they
    // scroll with the same buttery easing as the wheel. Without this, Next.js's
    // <Link> + the browser do an instant jump and fight with Lenis's transform.
    function handleAnchorClick(e: MouseEvent) {
      // Respect modifier keys (cmd-click to open in new tab, etc.) but DON'T
      // bail on defaultPrevented — Next.js's <Link> calls preventDefault before
      // this listener fires, so guarding on it would skip every hash link.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href?.startsWith("#") || href === "#") return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, {
        offset: -80, // leave room for the fixed nav
        duration: 1.4,
        easing: (t) => 1 - (1 - t) ** 3, // easeOutCubic — settles softly
      });
      history.pushState(null, "", href);
    }
    document.addEventListener("click", handleAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
