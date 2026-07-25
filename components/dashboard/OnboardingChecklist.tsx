import type { Route } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  hint: string;
  done: boolean;
  href: Route;
}

/**
 * "Getting started" guidance so a new business never lands on an empty
 * dashboard. Progress is derived from data the dashboard already loaded.
 */
export function OnboardingChecklist({
  hasCustomers,
  hasVisits,
}: {
  hasCustomers: boolean;
  hasVisits: boolean;
}) {
  const steps: Step[] = [
    {
      label: "Crea tu cuenta",
      hint: "Tu servicentro ya está activo.",
      done: true,
      href: "/dashboard/settings",
    },
    {
      label: "Configura tu programa",
      hint: "Define cuántos lavados dan una recompensa.",
      done: hasCustomers || hasVisits,
      href: "/dashboard/program",
    },
    {
      label: "Registra tu primer cliente",
      hint: "Comparte tu QR de registro o da de alta a un cliente.",
      done: hasCustomers,
      href: "/dashboard/qr",
    },
    {
      label: "Registra tu primera visita",
      hint: "Escanea la tarjeta del cliente y suma su lavado.",
      done: hasVisits,
      href: "/dashboard/scan",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const remaining = steps.length - doneCount;
  const pct = Math.round((doneCount / steps.length) * 100);
  const next = steps.find((s) => !s.done);

  return (
    <section
      aria-labelledby="onboarding-title"
      className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="onboarding-title" className="text-lg font-semibold">
            Bienvenido 👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {remaining === 0
              ? "Todo listo para operar tu programa."
              : `Solo ${remaining} paso${remaining > 1 ? "s" : ""} para comenzar.`}
          </p>
        </div>
        <span className="font-mono text-sm font-semibold text-muted-foreground">
          {doneCount}/{steps.length}
        </span>
      </div>

      {/* Progress */}
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de configuración"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-6 space-y-1">
        {steps.map((step) => {
          const isNext = step === next;
          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3",
                isNext && "bg-primary/[0.06]",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
                  step.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
                aria-hidden
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : ""}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    step.done && "text-muted-foreground line-through",
                  )}
                >
                  {step.label}
                </span>
                {!step.done && (
                  <span className="block text-xs text-muted-foreground">
                    {step.hint}
                  </span>
                )}
              </span>
              {isNext && (
                <Link
                  href={step.href}
                  className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
                >
                  Continuar
                  <ArrowRight aria-hidden />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
