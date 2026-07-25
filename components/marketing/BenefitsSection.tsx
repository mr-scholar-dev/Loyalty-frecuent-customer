import {
  Repeat,
  UserMinus,
  ShieldCheck,
  Database,
  Gift,
  LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BENEFITS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Repeat,
    title: "Conoce quién vuelve",
    text: "Identifica a tus clientes frecuentes y su historial de visitas para atenderlos mejor.",
  },
  {
    icon: UserMinus,
    title: "Detecta clientes inactivos",
    text: "Ubica a quienes dejaron de venir y decide a quién vale la pena recuperar.",
  },
  {
    icon: ShieldCheck,
    title: "Reduce errores operativos",
    text: "El progreso y las recompensas se calculan solos; menos confusiones en caja.",
  },
  {
    icon: Database,
    title: "Centraliza el historial",
    text: "Clientes, vehículos, visitas y recompensas en un mismo lugar, siempre a mano.",
  },
  {
    icon: Gift,
    title: "Controla recompensas",
    text: "Define la regla del programa y mantén cada canje registrado y auditable.",
  },
  {
    icon: LineChart,
    title: "Mide el desempeño del programa",
    text: "Sigue visitas y recompensas del mes para saber si tu fidelización funciona.",
  },
];

export function BenefitsSection() {
  return (
    <section id="funciones" className="scroll-mt-20 border-b py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            Para el negocio
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Más que recompensas: control sobre la relación con tus clientes.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
