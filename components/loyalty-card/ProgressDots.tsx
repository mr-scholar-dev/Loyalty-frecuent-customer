import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressDotsProps {
  current: number;
  required: number;
}

/**
 * Visual progress: one marker per required paid visit. Accessibility (§16):
 * does not rely on color alone — completed markers also show a check icon, and
 * the whole group has an accessible label.
 */
export function ProgressDots({ current, required }: ProgressDotsProps) {
  const dots = Array.from({ length: required }, (_, i) => i < current);

  return (
    <div
      className="flex flex-wrap gap-2"
      role="img"
      aria-label={`${current} de ${required} lavados completados`}
    >
      {dots.map((filled, i) => (
        <div
          key={i}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
            filled
              ? "border-white/80 bg-white/90 text-slate-900"
              : "border-white/40 bg-white/10 text-white/70",
          )}
        >
          {filled ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <span aria-hidden>{i + 1}</span>
          )}
        </div>
      ))}
    </div>
  );
}
