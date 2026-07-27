import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";
import { PRODUCT_NAME } from "./site-nav";

/** Wordmark used in the header and footer. Presentational, no interaction. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BrandMark className="h-8 w-8 shrink-0" />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        {PRODUCT_NAME}
      </span>
    </span>
  );
}
