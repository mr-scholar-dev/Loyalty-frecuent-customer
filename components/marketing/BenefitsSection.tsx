import {
  Repeat,
  UserMinus,
  ShieldCheck,
  Database,
  Gift,
  LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScrollStagger } from "@/components/motion/ScrollStagger";

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
    <section id="funciones" className="scroll-mt-20 border-b py-24 sm:py-28">
      <ScrollStagger className="mx-auto max-w-6xl px-4 sm:px-6" stagger={0.08}>
        <div className="max-w-2xl" data-reveal>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            Para el negocio
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Más que recompensas: control sobre la relación con tus clientes.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              data-reveal
              className="shadow-soft hover:shadow-float group rounded-2xl border bg-card p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
      </ScrollStagger>
    </section>
  );
}
