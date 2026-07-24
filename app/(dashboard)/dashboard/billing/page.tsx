import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingButton } from "@/components/dashboard/BillingButton";
import { PRO_PRICE_USD, CONTACT_PHONE } from "@/lib/site";

export const metadata: Metadata = { title: "Facturación" };
export const dynamic = "force-dynamic";

const PRO_FEATURES = [
  "Sucursales y clientes ilimitados",
  "Equipo con roles",
  "Reportes, exportación y auditoría",
  "Tablero Kanban",
  "Soporte por WhatsApp",
];

export default function BillingPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Facturación</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Tu plan y método de pago.
      </p>

      <Card className="border-primary ring-1 ring-primary/20">
        <CardHeader>
          <CardTitle className="flex items-baseline justify-between">
            <span>Plan Pro</span>
            <span className="font-mono text-2xl font-bold">
              ${PRO_PRICE_USD}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                /mes USD
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ul className="space-y-2 text-sm">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                {f}
              </li>
            ))}
          </ul>

          <BillingButton />

          <p className="text-xs text-muted-foreground">
            El pago se procesa de forma segura con Stripe. ¿Dudas? Escríbenos al{" "}
            {CONTACT_PHONE}.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
