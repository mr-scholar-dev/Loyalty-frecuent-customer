"use client";

import { useEffect, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

interface NumberTickerProps {
  value: number;
  className?: string;
}

/**
 * Animated counter (Magic UI pattern): springs from 0 to `value` when it
 * enters the viewport. Renders the final value directly under
 * prefers-reduced-motion or non-finite input.
 */
export function NumberTicker({ value, className }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 42, stiffness: 190 });
  const inView = useInView(ref, { once: true, margin: "-20px" });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current) {
          ref.current.textContent = Math.round(v).toLocaleString("es-CR");
        }
      }),
    [spring],
  );

  if (reduceMotion || !Number.isFinite(value)) {
    return (
      <span className={className}>{Number(value).toLocaleString("es-CR")}</span>
    );
  }

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
