import Link from "next/link";
import { ArrowRight, Check, Gift, QrCode, TriangleAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WHATSAPP_URL } from "@/lib/site";
import { ProductPreview } from "./ProductPreview";

const TRUST = [
  "Configuración rápida",
  "Funciona desde cualquier navegador",
  "Datos separados por negocio",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="bg-grid mask-radial pointer-events-none absolute inset-0 -z-10 opacity-60"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-24">
        <div className="animate-rise max-w-xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            Fidelización para negocios automotrices
          </p>
          <h1 className="mt-4 text-pretty text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Convierte cada visita en un cliente recurrente.
          </h1>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            Administra clientes, registra visitas, automatiza recompensas y
            detecta oportunidades de retención desde una sola plataforma. Sin
            aplicaciones que instalar y sin tarjetas físicas.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group w-full sm:w-auto",
              )}
            >
              Solicitar una demo
              <ArrowRight
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </a>
            <Link
              href={{ pathname: "/", hash: "como-funciona" }}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              Ver cómo funciona
            </Link>
          </div>

          <ul className="mt-8 flex flex-col gap-x-6 gap-y-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap">
            {TRUST.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Product showcase: dashboard is primary; card + alert are secondary. */}
        <div className="animate-rise relative [animation-delay:120ms]">
          <ProductPreview />

          {/* At-risk customer notification (decorative). */}
          <div
            aria-hidden
            className="animate-float absolute -right-3 -top-4 hidden items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 shadow-lg lg:flex"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <TriangleAlert className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold">Cliente por recuperar</p>
              <p className="text-[11px] text-muted-foreground">
                Sin visitas hace 34 días
              </p>
            </div>
          </div>

          {/* Digital loyalty card (secondary element). */}
          <div
            aria-hidden
            className="absolute -bottom-5 -left-3 hidden w-52 rounded-2xl border bg-surface-dark p-3.5 text-surface-dark-foreground shadow-xl sm:block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold">
                Auto Lavado El Sol
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase">
                Activa
              </span>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
              Progreso
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[88%] rounded-full bg-primary" />
              </div>
              <span className="font-mono text-[10px] font-semibold">8/9</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] text-surface-dark-foreground/80">
                <Gift className="h-3 w-3" /> 1 lavado gratis cerca
              </span>
              <QrCode className="h-7 w-7 text-surface-dark-foreground/90" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
