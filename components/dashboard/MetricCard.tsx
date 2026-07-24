import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
}

/** Compact KPI card for the dashboard (§15). */
export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {hint && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}
