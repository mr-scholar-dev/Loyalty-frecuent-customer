import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Pause the scroll while hovered. */
  pauseOnHover?: boolean;
}

/**
 * Infinite horizontal marquee (Magic UI pattern): two copies of the content
 * translate by exactly one copy's width. Pure CSS — the `marquee` animation
 * lives in tailwind.config.ts. Honors prefers-reduced-motion by stopping.
 */
export function Marquee({ children, className, pauseOnHover }: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [--duration:32s] [--gap:1.25rem]",
        className,
      )}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn(
            "flex shrink-0 animate-marquee items-stretch gap-[var(--gap)] pr-[var(--gap)] motion-reduce:animate-none",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
