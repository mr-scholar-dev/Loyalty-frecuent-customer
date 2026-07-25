import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_NAME } from "./site-nav";

/** Wordmark used in the header and footer. Presentational, no interaction. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Gauge className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        {PRODUCT_NAME}
      </span>
    </span>
  );
}
