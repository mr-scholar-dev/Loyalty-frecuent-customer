import type { ReactNode } from "react";
import {
  Gauge,
  Users,
  ClipboardCheck,
  Gift,
  UsersRound,
  Settings,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Resumen", icon: Gauge },
  { label: "Clientes", icon: Users },
  { label: "Visitas", icon: ClipboardCheck },
  { label: "Recompensas", icon: Gift },
  { label: "Equipo", icon: UsersRound },
  { label: "Configuración", icon: Settings },
] as const;

const METRICS = [
  { label: "Clientes activos", value: "324" },
  { label: "Visitas este mes", value: "486" },
  { label: "Recompensas disponibles", value: "27" },
  { label: "Clientes por recuperar", value: "18" },
] as const;

const ACTIVITY = [
  { text: "Nueva visita registrada", tone: "success" as const, tag: "Visita" },
  { text: "Recompensa canjeada", tone: "primary" as const, tag: "Premio" },
  {
    text: "Cliente alcanzó 8 de 9 visitas",
    tone: "warning" as const,
    tag: "Progreso",
  },
  { text: "Nuevo cliente registrado", tone: "neutral" as const, tag: "Alta" },
] as const;

const BARS = [38, 52, 44, 66, 58, 74, 62];

const toneChip: Record<string, string> = {
  success: "bg-success/10 text-success",
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-muted text-muted-foreground",
};

/** Default "Resumen" panel. Decorative demo content only. */
export function SummaryPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="rounded-xl border bg-card p-3.5">
            <p className="font-mono text-xl font-bold tracking-tight sm:text-2xl">
              {m.value}
            </p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold">Visitas por semana</p>
            <span className="rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] font-medium text-success">
              activo
            </span>
          </div>
          <div className="flex h-24 items-end gap-2">
            {BARS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-primary/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <p className="mb-3 text-xs font-semibold">Actividad reciente</p>
          <ul className="space-y-2.5">
            {ACTIVITY.map((a) => (
              <li key={a.text} className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase",
                    toneChip[a.tone],
                  )}
                >
                  {a.tag}
                </span>
                <span className="truncate text-[11px] text-foreground/80">
                  {a.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Presentational dashboard mockup. It is the primary visual of the landing.
 * Marked as an image so assistive tech announces it as a preview instead of
 * reading the demo numbers as real content.
 */
export function ProductPreview({
  activeNav = "Resumen",
  main,
  className,
}: {
  activeNav?: string;
  main?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="Vista previa del panel de administración de Loyalty Web"
      className={cn(
        "overflow-hidden rounded-2xl border bg-background shadow-xl ring-1 ring-black/5",
        className,
      )}
    >
      <div aria-hidden className="flex">
        {/* Sidebar — hidden on the smallest screens to keep it legible. */}
        <aside className="hidden w-40 shrink-0 flex-col border-r bg-card p-3 sm:flex">
          <div className="mb-4 flex items-center gap-2 px-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Gauge className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold">Loyalty Web</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium",
                  label === activeNav
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </nav>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b bg-card px-4 py-2.5">
            <p className="text-xs font-semibold">{activeNav}</p>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[10px] text-muted-foreground sm:flex">
                <Search className="h-3 w-3" />
                Buscar cliente…
              </span>
              <span className="h-6 w-6 rounded-full bg-primary/15" />
            </div>
          </div>
          <div className="bg-muted/40 p-4">{main ?? <SummaryPanel />}</div>
        </div>
      </div>
    </div>
  );
}
