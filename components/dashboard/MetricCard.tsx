import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumberTicker } from "@/components/motion/NumberTicker";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
}

/** Compact KPI card for the dashboard (§15). Numeric values count up. */
export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "shadow-soft hover:shadow-float group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-primary/[0.05] transition-transform duration-300 group-hover:scale-125"
      />
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2.5 text-3xl font-bold tabular-nums tracking-tight">
        {typeof value === "number" ? <NumberTicker value={value} /> : value}
      </p>
      {hint && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
