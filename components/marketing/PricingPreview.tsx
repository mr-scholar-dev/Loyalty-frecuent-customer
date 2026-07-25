import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRO_PRICE_USD, PRO_PRICE_USD_ANNUAL, WHATSAPP_URL } from "@/lib/site";

const FEATURES = [
  "Clientes y sucursales ilimitados",
  "Tarjeta digital con QR",
  "Registro de visitas y recompensas automáticas",
  "Equipo con roles",
  "Reportes, exportación y auditoría",
  "Asistente con IA para consultar tu negocio",
  "Soporte por WhatsApp",
];

export function PricingPreview() {
  return (
    <section className="border-b py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="max-w-lg">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              Precios
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Un plan simple para comenzar.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              Digitaliza tu programa de clientes frecuentes sin desarrollar una
              aplicación propia. Un plan único con todo lo necesario para
              operar.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/precios"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full sm:w-auto",
                )}
              >
                Ver planes y precios
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto",
                )}
              >
                Solicitar una demo
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm ring-1 ring-primary/10 sm:p-8">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold">Plan Pro</span>
              <span className="text-right">
                <span className="font-mono text-3xl font-bold tracking-tight">
                  ${PRO_PRICE_USD}
                </span>
                <span className="text-sm text-muted-foreground"> /mes USD</span>
                <span className="block text-xs text-primary">
                  o ${PRO_PRICE_USD_ANNUAL}/mes facturado anual
                </span>
              </span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
