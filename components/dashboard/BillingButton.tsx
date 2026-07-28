"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { createCheckout } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRO_ANNUAL_SAVINGS_PCT } from "@/lib/site";

type PlanInterval = "monthly" | "annual";

export function BillingButton() {
  const [plan, setPlan] = useState<PlanInterval>("monthly");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function subscribe() {
    setMessage(null);
    startTransition(async () => {
      // On success this redirects to Stripe; only failures return here.
      const result = await createCheckout(plan);
      if (result && !result.ok) setMessage(result.message);
    });
  }

  return (
    <div className="space-y-3">
      <div
        className="inline-flex w-full rounded-lg border bg-muted/40 p-0.5 text-sm"
        role="tablist"
        aria-label="Ciclo de facturación"
      >
        <button
          type="button"
          role="tab"
          aria-selected={plan === "monthly"}
          onClick={() => setPlan("monthly")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
            plan === "monthly"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          Mensual
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={plan === "annual"}
          onClick={() => setPlan("annual")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
            plan === "annual"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          Anual
          <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
            −{PRO_ANNUAL_SAVINGS_PCT}%
          </span>
        </button>
      </div>

      <Button size="lg" onClick={subscribe} disabled={isPending}>
        {isPending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <CreditCard aria-hidden />
        )}
        Suscribirse al plan Pro
      </Button>
      {message && (
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
