import { cn } from "@/lib/utils";

/**
 * Fake macOS Safari window chrome — wraps a child component to make it
 * read as a "real product screenshot" in marketing sections. Pure CSS, no
 * imagery, scales with the parent.
 */
export function BrowserFrame({
  children,
  url = "livingphotos.app",
  className,
}: {
  children: React.ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--color-border)]",
        "bg-[var(--color-surface)] shadow-[0_40px_120px_-30px_rgba(20,17,13,0.25)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        <div className="ml-4 flex-1 rounded-md bg-[var(--color-bg)] px-3 py-1 text-center text-xs text-[var(--color-foreground-muted)]">
          {url}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
