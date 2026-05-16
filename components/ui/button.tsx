import Link from "next/link";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  testId?: string;
}

const sizes = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const variants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "text-foreground hover:text-[var(--color-accent)] transition-colors",
};

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className,
  type = "button",
  testId,
}: ButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium",
    "select-none",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    sizes[size],
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={base} data-testid={testId}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base} data-testid={testId}>
      {children}
    </button>
  );
}
