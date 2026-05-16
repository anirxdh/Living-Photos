"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Nav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 120], ["rgba(10,10,11,0)", "rgba(10,10,11,0.7)"]);
  const borderOpacity = useTransform(scrollY, [0, 120], [0, 1]);
  const blur = useTransform(scrollY, [0, 120], ["blur(0px)", "blur(20px)"]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        backgroundColor: bg,
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
      }}
    >
      <motion.div
        style={{ opacity: borderOpacity }}
        className="absolute inset-x-0 bottom-0 h-px bg-[var(--color-border)]"
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="headline text-2xl text-[var(--color-foreground)]">
          Living Photos
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#how-it-works"
            className="text-sm text-[var(--color-foreground-secondary)] transition-colors hover:text-[var(--color-foreground)]"
          >
            How it works
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-[var(--color-foreground-secondary)] transition-colors hover:text-[var(--color-foreground)]"
          >
            My memories
          </Link>
          <Link
            href="/press"
            className="text-sm text-[var(--color-foreground-secondary)] transition-colors hover:text-[var(--color-foreground)]"
          >
            Press
          </Link>
        </nav>
        <Button href="/create" size="sm" variant="primary">
          Bring a memory to life
        </Button>
      </div>
    </motion.header>
  );
}
