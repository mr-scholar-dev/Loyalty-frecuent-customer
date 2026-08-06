import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CONTACT_PHONE,
  PRO_PRICE_USD,
  PRO_PRICE_USD_ANNUAL,
  WHATSAPP_URL,
} from "@/lib/site";

const CONTACT_HREF = WHATSAPP_URL;
const CONTACT_LABEL = "Comprar Plan";

interface Plan {
  name: string;
  price: string;
  period?: string;
  annualNote?: string;
  tagline: string;
  features: string[];
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Pro",
    price: `$${PRO_PRICE_USD}`,
    period: "/mes",
    annualNote: `o $${PRO_PRICE_USD_ANNUAL}/mes facturado anual`,
    tagline: "Todo lo que tu servicentro necesita.",
    features: [
      "Copiloto con IA (consulta y crea tareas)",
      "Clientes en riesgo + mensajes de reactivación",
      "Tablero Kanban con equipo",
      "Sucursales y clientes ilimitados",
      "Tarjeta digital con QR",
      "Escáner y registro de lavados",
      "Equipo con roles (owner/manager/empleado)",
      "Reportes, exportación CSV y auditoría",
      "Soporte por WhatsApp",
    ],
    featured: true,
  },
  {
    name: "Empresa",
    price: "A medida",
    tagline: "Para cadenas y marca blanca.",
    features: [
      "Todo lo de Pro",
      "Multi-marca / marca blanca",
      "Acceso por API",
      "Onboarding dedicado",
      "Soporte prioritario",
    ],
  },
];

export function PricingCards() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "relative flex flex-col rounded-lg border bg-card p-6 shadow-sm",
            plan.featured && "border-primary shadow-md ring-1 ring-primary/20",
          )}
        >
          {plan.featured && (
            <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Recomendado
            </span>
          )}
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-mono text-4xl font-bold tracking-tight">
              {plan.price}
            </span>
            {plan.period && (
              <span className="text-sm text-muted-foreground">
                {plan.period} <span className="text-xs">USD</span>
              </span>
            )}
          </div>
          {plan.annualNote && (
            <p className="mt-1.5 text-xs font-medium text-primary">
              {plan.annualNote}
            </p>
          )}

          <ul className="mt-6 flex-1 space-y-3 text-sm">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <a
            href={CONTACT_HREF}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({
                variant: plan.featured ? "default" : "outline",
                size: "lg",
              }),
              "mt-8 w-full",
            )}
          >
            {plan.featured ? CONTACT_LABEL : "Hablar con ventas"}
          </a>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {CONTACT_PHONE} · Pago manual por WhatsApp
          </p>
        </div>
      ))}
    </div>
  );
}
