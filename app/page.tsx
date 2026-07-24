import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Gift,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { WHATSAPP_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const stats = [
  { value: "9 → 1", label: "Lavados por recompensa" },
  { value: "2 min", label: "Registro del cliente" },
  { value: "0", label: "Apps que instalar" },
  { value: "100%", label: "En el navegador" },
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
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b">
          {/* Industrial grid texture + brand glow */}
          <div
            aria-hidden
            className="bg-grid mask-radial pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(176 84% 30% / 0.35), transparent)",
            }}
          />

          <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
            <div className="animate-in fade-in slide-in-from-bottom-3 space-y-7 duration-700">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Fidelización para servicentros
              </span>

              <h1 className="text-[2.7rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Cada lavado, un
                <br className="hidden sm:block" /> cliente que{" "}
                <span className="relative whitespace-nowrap text-primary">
                  vuelve
                  <svg
                    aria-hidden
                    viewBox="0 0 200 12"
                    className="absolute -bottom-1 left-0 h-2.5 w-full text-accent"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 8 C 60 2, 140 2, 198 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>

              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                Tarjetas de cliente frecuente 100% digitales: registro con QR,
                control de lavados y recompensas automáticas. Sin app, sin
                plástico — y con un asistente de IA que te dice a quién reactivar.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/precios"
                  className={cn(buttonVariants({ size: "lg" }), "group")}
                >
                  Empezar ahora
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
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

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" aria-hidden />
                  Sin app que instalar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                  Datos aislados por servicentro
                </span>
              </div>
            </div>

            {/* Layered product mockup */}
            <div className="animate-in fade-in slide-in-from-bottom-4 relative mx-auto w-full max-w-sm duration-1000">
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-[2.5rem] opacity-30 blur-2xl"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(176 84% 27%), hsl(187 92% 43%))",
                }}
              />

              {/* Floating reward toast */}
              <div className="absolute -left-6 top-10 z-10 hidden animate-in fade-in slide-in-from-left-4 rounded-xl border bg-card px-3.5 py-2.5 shadow-xl duration-1000 sm:flex sm:items-center sm:gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Gift className="h-4 w-4" aria-hidden />
                </span>
                <div className="leading-tight">
                  <p className="text-xs font-semibold">¡Recompensa lista!</p>
                  <p className="text-[11px] text-muted-foreground">
                    Lavado gratis disponible
                  </p>
                </div>
              </div>

              {/* Floating stat chip */}
              <div className="absolute -right-4 bottom-16 z-10 hidden rounded-xl border bg-card px-3.5 py-2.5 shadow-xl sm:block">
                <p className="font-mono text-lg font-bold text-primary">+38%</p>
                <p className="text-[11px] text-muted-foreground">
                  clientes que regresan
                </p>
              </div>

              {/* The loyalty card */}
              <div
                className="space-y-4 rounded-3xl p-6 text-white shadow-2xl ring-1 ring-black/10"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(176 84% 24%), hsl(191 90% 36%))",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15">
                      <Smartphone className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    Auto Lavado El Sol
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide">
                    Activa
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                    Cliente
                  </p>
                  <p className="text-xl font-bold">María R••••••</p>
                  <p className="font-mono text-sm text-white/80">BMT-345</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                    Progreso
                  </span>
                  <span className="font-mono text-xs font-semibold text-white/90">
                    3 / 9
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[11px] font-semibold",
                        i < 3
                          ? "border-white/80 bg-white text-teal-800"
                          : "border-white/30 text-white/60",
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

        {/* ── Stats strip ─────────────────────────────────────── */}
        <section className="border-b bg-muted/30">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            {stats.map((s) => (
              <div key={s.label} className="px-6 py-7 text-center">
                <p className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features (bento) ────────────────────────────────── */}
        <section id="features" className="py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                Plataforma
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Todo el programa de lealtad, en un solo lugar
              </h2>
              <p className="mt-3 text-muted-foreground">
                Desde la inscripción hasta la recompensa — y con inteligencia
                para no perder clientes.
              </p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-6">
              {/* AI highlight */}
              <div
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl p-7 text-white shadow-lg lg:col-span-4 lg:row-span-1"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(200 60% 10%), hsl(176 84% 20%))",
                }}
              >
                <div
                  aria-hidden
                  className="bg-dots pointer-events-none absolute inset-0 opacity-[0.08]"
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-accent">
                      <Sparkles className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">
                      Incluido en Pro
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold">Asistente con IA</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
                    Pregúntale cómo va tu negocio en lenguaje natural, detecta
                    clientes en riesgo de no volver y genera el mensaje de
                    WhatsApp para reactivarlos — en un clic.
                  </p>
                </div>
                <div className="relative mt-6 space-y-2">
                  {[
                    "¿Qué clientes no vuelven hace 30 días?",
                    "Resúmeme el mes y sugiere una promo.",
                  ].map((q) => (
                    <div
                      key={q}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white/80"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
                      {q}
                    </div>
                  ))}
                </div>
              </div>

              <BentoTile
                className="lg:col-span-2"
                icon={QrCode}
                title="Tarjeta digital con QR"
                description="Una URL privada por cliente con progreso, recompensas y código QR. Sin plástico."
              />
              <BentoTile
                className="lg:col-span-2"
                icon={ScanLine}
                title="Escaneo y lavados"
                description="Tu personal escanea, registra el lavado y canjea premios en segundos."
              />
              <BentoTile
                className="lg:col-span-2"
                icon={Gift}
                title="Recompensas automáticas"
                description="Define la regla (9 lavados = 1 gratis) y el sistema genera el premio solo."
              />
              <BentoTile
                className="lg:col-span-2"
                icon={BarChart3}
                title="Panel y reportes"
                description="Métricas del día, visitas, auditoría y exportación CSV — todo a la mano."
              />
              <BentoTile
                className="lg:col-span-2"
                icon={UserPlus}
                title="Inscripción en 2 min"
                description="El cliente escanea, llena un formulario corto y recibe su tarjeta al instante."
              />
              <BentoTile
                className="lg:col-span-2"
                icon={ShieldCheck}
                title="Seguro y multiempresa"
                description="Aislamiento por organización con RLS, roles por empleado y auditoría total."
              />
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────── */}
        <section id="how" className="border-t bg-muted/30 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                Puesta en marcha
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                En marcha en minutos
              </h2>
              <p className="mt-3 text-muted-foreground">
                Sin instalar nada, sin hardware especial.
              </p>
            </div>

            <div className="relative mt-14 grid gap-10 md:grid-cols-3">
              {/* connector line */}
              <div
                aria-hidden
                className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
              />
              {steps.map((step, i) => (
                <div key={step.title} className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background font-mono text-sm font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA band ────────────────────────────────────────── */}
        <section className="py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div
              className="relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white shadow-xl sm:px-12"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, hsl(200 55% 11%), hsl(176 84% 22%))",
              }}
            >
              <div
                aria-hidden
                className="bg-dots pointer-events-none absolute inset-0 opacity-[0.08]"
              />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  ¿Listo para fidelizar a tus clientes?
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-white/70">
                  Prueba la demo o habla con nosotros. Lo montamos contigo en un
                  día.
                </p>
                <ul className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/80">
                  {["Sin permanencia", "Soporte por WhatsApp", "Datos seguros"].map(
                    (f) => (
                      <li key={f} className="inline-flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-accent" aria-hidden />
                        {f}
                      </li>
                    ),
                  )}
                </ul>
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
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
                    )}
                  >
                    Escríbenos por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function BentoTile({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
