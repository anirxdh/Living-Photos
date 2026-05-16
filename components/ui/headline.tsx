import { cn } from "@/lib/utils";

interface HeadlineProps {
  children: React.ReactNode;
  className?: string;
  size?: "hero" | "section" | "card";
  as?: "h1" | "h2" | "h3";
}

const sizes = {
  hero: "text-[clamp(56px,11vw,164px)] leading-[0.92]",
  section: "text-[clamp(40px,6vw,84px)] leading-[1.02]",
  card: "text-[clamp(28px,3.5vw,48px)] leading-[1.05]",
};

export function Headline({ children, className, size = "section", as: As = "h2" }: HeadlineProps) {
  return <As className={cn("headline", sizes[size], className)}>{children}</As>;
}
