import type { Route } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  price: string;
  period?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Gratis",
    price: "₡0",
    period: "/mes",
    tagline: "Para empezar y probar el programa.",
    features: [
      "1 sucursal",
      "Hasta 200 clientes",
      "Tarjeta digital con QR",
      "Escáner y registro de lavados",
      "1 usuario",
    ],
    cta: { label: "Ver demo", href: "/el-sol" },
  },
  {
    name: "Pro",
    price: "₡14.900",
    period: "/mes",
    tagline: "Para servicentros en crecimiento.",
    features: [
      "Sucursales ilimitadas",
      "Clientes ilimitados",
      "Equipo con roles (owner/manager/empleado)",
      "Reportes y exportación CSV",
      "Auditoría completa",
      "Soporte por correo",
    ],
    cta: {
      label: "Elegir Pro",
      href: "mailto:ventas@loyaltyweb.cr?subject=Plan%20Pro",
    },
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
    cta: {
      label: "Contáctanos",
      href: "mailto:ventas@loyaltyweb.cr?subject=Plan%20Empresa",
    },
  },
];

export function PricingCards() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
            plan.featured && "border-primary shadow-md ring-1 ring-primary/20",
          )}
        >
          {plan.featured && (
            <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Más popular
            </span>
          )}
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">
              {plan.price}
            </span>
            {plan.period && (
              <span className="text-sm text-muted-foreground">
                {plan.period}
              </span>
            )}
          </div>

          <ul className="mt-6 space-y-3 text-sm">
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

          {plan.cta.href.startsWith("mailto:") ? (
            <a
              href={plan.cta.href}
              className={cn(
                buttonVariants({
                  variant: plan.featured ? "default" : "outline",
                  size: "lg",
                }),
                "mt-8 w-full",
              )}
            >
              {plan.cta.label}
            </a>
          ) : (
            <Link
              href={plan.cta.href as Route}
              className={cn(
                buttonVariants({
                  variant: plan.featured ? "default" : "outline",
                  size: "lg",
                }),
                "mt-8 w-full",
              )}
            >
              {plan.cta.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
