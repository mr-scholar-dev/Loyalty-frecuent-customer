"use client";

import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WHATSAPP_URL } from "@/lib/site";

export function BillingButton() {
  return (
    <div className="space-y-2">
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
      >
        <MessageCircle aria-hidden />
        Activar Suscripción por WhatsApp
      </a>
      <p className="text-xs text-muted-foreground">
        Te compartiremos SINPE Móvil, PayPal.Me o USDT según tu país.
      </p>
    </div>
  );
}
