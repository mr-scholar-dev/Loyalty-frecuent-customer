"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ScrollStaggerProps {
  children: ReactNode;
  className?: string;
  /** Elements to animate, relative to the wrapper. */
  selector?: string;
  /** Seconds between each element. */
  stagger?: number;
}

/**
 * GSAP ScrollTrigger stagger: descendants matching `selector` (default
 * `[data-reveal]`) rise in sequence when the wrapper enters the viewport.
 * Server children just tag themselves with the data attribute.
 */
export function ScrollStagger({
  children,
  className,
  selector = "[data-reveal]",
  stagger = 0.14,
}: ScrollStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      const items = gsap.utils.toArray<HTMLElement>(selector, ref.current);
      if (items.length === 0) return;
      gsap.from(items, {
        opacity: 0,
        y: 26,
        duration: 0.7,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: ref.current, start: "top 78%" },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
