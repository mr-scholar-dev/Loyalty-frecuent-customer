import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Droplets,
  Gift,
  LayoutDashboard,
  QrCode,
  ScanLine,
  UserPlus,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: UserPlus,
    title: "Inscripción en 2 minutos",
    description:
      "El cliente escanea un QR, se registra y recibe su tarjeta digital al instante.",
  },
  {
    icon: QrCode,
    title: "Tarjeta digital con QR",
    description:
      "Sin app que instalar: una URL privada con progreso, recompensas y código QR.",
  },
  {
    icon: ScanLine,
    title: "Escaneo y lavados",
    description:
      "El personal escanea, registra el lavado y canjea recompensas en segundos.",
  },
  {
    icon: Gift,
    title: "9 lavados, 1 gratis",
    description:
      "El programa se controla solo: al noveno lavado se genera la recompensa.",
  },
];

const demos = [
  {
    href: "/el-sol",
    icon: UserPlus,
    label: "Inscripción del cliente",
    hint: "Landing + formulario de un servicentro",
  },
  {
    href: "/c/demo",
    icon: CreditCard,
    label: "Tarjeta digital",
    hint: "Vista pública con QR y progreso",
  },
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Panel administrativo",
    hint: "Métricas, clientes, escáner y más",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Droplets className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-bold">Loyalty Web</span>
        </div>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Entrar al panel
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-10 pt-10 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Droplets className="h-3.5 w-3.5" aria-hidden /> Fidelización para
              servicentros
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Tarjetas de cliente frecuente,{" "}
              <span className="text-primary">100% digitales</span>.
            </h1>
            <p className="text-lg text-muted-foreground">
              Registra clientes, emite tarjetas con QR, controla lavados y
              genera recompensas automáticamente. Sin app que instalar.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Ver el panel <ArrowRight aria-hidden />
              </Link>
              <Link
                href="/c/demo"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                )}
              >
                Ver tarjeta demo
              </Link>
            </div>
          </div>

          {/* Decorative card preview */}
          <div className="relative mx-auto w-full max-w-sm">
            <div
              className="space-y-4 rounded-3xl p-6 text-white shadow-xl"
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
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="space-y-2 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Demo entry points */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-1 text-xl font-bold">Pruébalo</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Recorre el flujo completo con datos de demostración.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {demos.map(({ href, icon: Icon, label, hint }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="flex items-center justify-between font-semibold">
                {label}
                <ArrowRight
                  className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground">
          <span>
            Demo con datos en memoria · sin base de datos ni autenticación
            todavía.
          </span>
          <Link href="/api/health" className="hover:text-foreground">
            Estado del servicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
