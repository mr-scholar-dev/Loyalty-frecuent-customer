import Link from "next/link";
import { ArrowRight, Check, Gift, QrCode } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WHATSAPP_URL } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
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
        className="bg-grid mask-radial pointer-events-none absolute inset-0 -z-20 opacity-50"
      />
      <div
        aria-hidden
        className="aurora pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-28">
        <Reveal className="max-w-lg">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            Fidelización para negocios automotrices
          </p>
          <h1 className="mt-5 text-balance text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] sm:text-6xl">
            Convierte cada visita en un cliente recurrente.
          </h1>
          <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            Administra clientes, registra visitas y automatiza recompensas desde
            una sola plataforma. Sin aplicaciones que instalar y sin tarjetas
            físicas.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/registro"
              className={cn(
                buttonVariants({ size: "lg" }),
                "shadow-soft shimmer group w-full sm:w-auto",
              )}
            >
              Crear mi cuenta
              <ArrowRight
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden
              />
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

          <ul className="mt-9 flex flex-col gap-x-6 gap-y-2.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap">
            {TRUST.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Product showcase — dashboard is the absolute protagonist. */}
        <Reveal delay={0.15} className="relative lg:-mr-6 xl:-mr-16">
          <ProductPreview compact className="lg:origin-left lg:scale-[1.04]" />

          {/* Reward chip (glass, very light). Concept reinforcement only. */}
          <div
            aria-hidden
            className="glass animate-float shadow-float absolute -right-3 top-8 hidden items-center gap-2.5 rounded-xl border px-3 py-2 lg:flex"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gift className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold">Recompensa disponible</p>
              <p className="text-[11px] text-muted-foreground">
                1 lavado gratis
              </p>
            </div>
          </div>

          {/* Digital loyalty card — small, reinforces the concept. */}
          <div
            aria-hidden
            className="shadow-float absolute -bottom-6 -left-4 hidden w-48 rounded-2xl border border-white/10 bg-surface-dark p-3.5 text-surface-dark-foreground sm:block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold">
                Auto Lavado El Sol
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase">
                Activa
              </span>
            </div>
            <p className="mt-2.5 font-mono text-[9px] uppercase tracking-widest text-surface-dark-foreground/60">
              Progreso
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[88%] rounded-full bg-primary" />
              </div>
              <span className="font-mono text-[10px] font-semibold">8/9</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-surface-dark-foreground/70">
                Tarjeta con QR
              </span>
              <QrCode className="h-7 w-7 text-surface-dark-foreground/90" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
