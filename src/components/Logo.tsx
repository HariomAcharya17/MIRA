import { cn } from "@/lib/utils";

/** Mira wordmark glyph: a rounded square with an "M". Uses the brand color. */
export const Logo = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={cn(
      "inline-flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground text-[13px] font-semibold",
      className,
    )}
  >
    M
  </span>
);
