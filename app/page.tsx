import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Gift,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  UserPlus,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { PricingCards } from "@/components/marketing/PricingCards";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: UserPlus,
    title: "Inscripción en 2 minutos",
    description:
      "El cliente escanea tu QR, llena un formulario corto y recibe su tarjeta al instante.",
  },
  {
    icon: QrCode,
    title: "Tarjeta digital con QR",
    description:
      "Una URL privada por cliente con progreso, recompensas y código QR. Sin app que instalar.",
  },
  {
    icon: ScanLine,
    title: "Escaneo y lavados",
    description:
      "Tu personal escanea, registra el lavado y canjea recompensas en segundos, con confirmación.",
  },
  {
    icon: Gift,
    title: "Recompensas automáticas",
    description:
      "Define la regla (p. ej. 9 lavados = 1 gratis) y el sistema genera la recompensa solo.",
  },
  {
    icon: BarChart3,
    title: "Panel y reportes",
    description:
      "Métricas del día, clientes, visitas, auditoría y exportación CSV — todo en un lugar.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro y multiempresa",
    description:
      "Aislamiento por organización con RLS, roles por empleado y auditoría de cada movimiento.",
  },
];

const steps = [
  {
    title: "Muestra tu QR",
    description:
      "Imprime el código de inscripción de tu servicentro y colócalo en caja o en la entrada.",
  },
  {
    title: "El cliente se inscribe",
    description:
      "Escanea, se registra y obtiene su tarjeta digital con QR para guardar en el teléfono.",
  },
  {
    title: "Acumula y premia",
    description:
      "En cada visita escaneas su tarjeta; al completar el ciclo, la recompensa aparece sola.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-60"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, hsl(243 75% 59% / 0.12), transparent 70%)",
            }}
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                Fidelización para servicentros
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Convierte cada lavado en un{" "}
                <span className="text-primary">cliente que vuelve</span>.
              </h1>
              <p className="max-w-lg text-lg text-muted-foreground">
                Tarjetas de cliente frecuente 100% digitales: registro con QR,
                control de lavados y recompensas automáticas. Sin app, sin
                tarjetas plásticas.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/precios"
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Empezar <ArrowRight aria-hidden />
                </Link>
                <Link
                  href="/el-sol"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                  )}
                >
                  Ver demo en vivo
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" aria-hidden />{" "}
                  Sin app que instalar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />{" "}
                  Datos aislados por servicentro
                </span>
              </div>
            </div>

            {/* Card mockup */}
            <div className="relative mx-auto w-full max-w-sm">
              <div
                className="absolute -inset-4 -z-10 rounded-[2rem] opacity-30 blur-2xl"
                style={{
                  backgroundImage: "linear-gradient(135deg, #0f766e, #0ea5e9)",
                }}
              />
              <div
                className="space-y-4 rounded-3xl p-6 text-white shadow-2xl ring-1 ring-black/5"
                style={{
                  backgroundImage: "linear-gradient(135deg, #0f766e, #0ea5e9)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Auto Lavado El Sol
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase">
                    Activa
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    Cliente
                  </p>
                  <p className="text-xl font-bold">María R••••••</p>
                  <p className="text-sm text-white/90">BMT345</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold",
                        i < 3
                          ? "border-white/80 bg-white/90 text-slate-900"
                          : "border-white/40 text-white/70",
                      )}
                    >
                      {i < 3 ? "✓" : i + 1}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-center rounded-2xl bg-white p-4">
                  <QrCode className="h-20 w-20 text-slate-900" aria-hidden />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t bg-muted/20 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Todo lo que necesita tu programa de lealtad
              </h2>
              <p className="mt-3 text-muted-foreground">
                Desde la inscripción hasta la recompensa, en una plataforma
                pensada para el mostrador.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Cómo funciona
              </h2>
              <p className="mt-3 text-muted-foreground">
                En marcha en minutos, sin instalar nada.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.title} className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t bg-muted/20 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Precios simples
              </h2>
              <p className="mt-3 text-muted-foreground">
                Empieza gratis. Crece cuando lo necesites.
              </p>
            </div>
            <div className="mt-12">
              <PricingCards />
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="overflow-hidden rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground shadow-lg sm:px-12">
              <h2 className="text-3xl font-bold tracking-tight">
                ¿Listo para fidelizar a tus clientes?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
                Prueba la demo o habla con nosotros. Lo montamos contigo en un
                día.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/el-sol"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                  )}
                >
                  Ver demo en vivo
                </Link>
                <a
                  href="mailto:ventas@loyaltyweb.cr?subject=Quiero%20Loyalty%20Web"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
                  )}
                >
                  Hablar con ventas
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
