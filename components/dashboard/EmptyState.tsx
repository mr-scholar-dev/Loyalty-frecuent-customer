import type { Route } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  href: Route;
}

/**
 * Consistent empty state: an icon, a short explanation and (optionally) the
 * primary next action. Teaches instead of just saying "no data".
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondary,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: Action;
  secondary?: Action;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
        aria-hidden
      >
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Link
              href={action.href}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              {action.label}
            </Link>
          )}
          {secondary && (
            <Link
              href={secondary.href}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {secondary.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
