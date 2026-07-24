"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { createCheckout } from "@/actions/billing";
import { Button } from "@/components/ui/button";

export function BillingButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function subscribe() {
    setMessage(null);
    startTransition(async () => {
      // On success this redirects to Stripe; only failures return here.
      const result = await createCheckout();
      if (result && !result.ok) setMessage(result.message);
    });
  }

  return (
    <div className="space-y-2">
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
