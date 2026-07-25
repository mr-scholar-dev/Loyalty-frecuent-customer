import { Building2, KeyRound, ScrollText, Lock, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const POINTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Building2,
    title: "Datos separados por negocio",
    text: "Cada organización ve únicamente su propia información.",
  },
  {
    icon: KeyRound,
    title: "Roles y permisos",
    text: "Define qué puede hacer cada persona de tu equipo.",
  },
  {
    icon: ScrollText,
    title: "Historial de operaciones",
    text: "Las acciones críticas quedan registradas para su revisión.",
  },
  {
    icon: Lock,
    title: "Acceso protegido",
    text: "Ingreso con credenciales y sesión administrada de forma segura.",
  },
  {
    icon: Server,
    title: "Infraestructura administrada",
    text: "Datos alojados sobre infraestructura gestionada y respaldada.",
  },
];

export function SecuritySection() {
  return (
    <section className="border-b bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            Seguridad y confianza
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Cada negocio controla únicamente su información.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-card p-6">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-3 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>

        <details className="group mt-8 max-w-2xl rounded-2xl border bg-card p-5">
          <summary className="cursor-pointer list-none text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-primary transition-transform group-open:rotate-90">
                ›
              </span>
              Detalle para equipos técnicos
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            El aislamiento entre organizaciones se aplica a nivel de base de
            datos mediante Row Level Security (RLS), no solo en la interfaz. Los
            roles (owner, manager, empleado) siguen el principio de mínimo
            privilegio y las operaciones críticas se registran para auditoría.
            La organización se deriva siempre de la sesión, nunca de datos
            enviados por el cliente.
          </p>
        </details>
      </div>
    </section>
  );
}
