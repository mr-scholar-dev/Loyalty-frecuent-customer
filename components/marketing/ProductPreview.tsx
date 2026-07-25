import type { ReactNode } from "react";
import {
  Gauge,
  Users,
  Car,
  ClipboardCheck,
  Gift,
  UsersRound,
  Settings,
  Search,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavEntry {
  label: string;
  icon: LucideIcon;
  badge?: string;
}
const NAV: NavEntry[] = [
  { label: "Resumen", icon: Gauge },
  { label: "Clientes", icon: Users },
  { label: "Vehículos", icon: Car },
  { label: "Visitas", icon: ClipboardCheck },
  { label: "Recompensas", icon: Gift, badge: "27" },
  { label: "Equipo", icon: UsersRound },
];

const METRICS = [
  { label: "Clientes activos", value: "324", trend: "+12" },
  { label: "Visitas este mes", value: "486", trend: "+8%" },
  { label: "Recompensas disponibles", value: "27", trend: null },
  { label: "Clientes por recuperar", value: "18", trend: null, warn: true },
] as const;

const ACTIVITY = [
  {
    who: "MR",
    text: "Nueva visita registrada",
    when: "hace 2 min",
    tone: "success",
  },
  {
    who: "LP",
    text: "Recompensa canjeada",
    when: "hace 18 min",
    tone: "primary",
  },
  {
    who: "AC",
    text: "Cliente alcanzó 8 de 9 visitas",
    when: "hace 1 h",
    tone: "warning",
  },
  {
    who: "JS",
    text: "Nuevo cliente registrado",
    when: "hace 3 h",
    tone: "neutral",
  },
] as const;

const BARS = [40, 54, 46, 68, 58, 76, 64];

const toneDot: Record<string, string> = {
  success: "bg-success",
  primary: "bg-primary",
  warning: "bg-warning",
  neutral: "bg-muted-foreground/40",
};

export function SummaryPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="shadow-soft rounded-xl border bg-card p-3.5"
          >
            <div className="flex items-start justify-between">
              <p className="font-mono text-2xl font-semibold tracking-tight">
                {m.value}
              </p>
              {m.trend && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 font-mono text-[9px] font-medium text-success">
                  <ArrowUpRight className="h-2.5 w-2.5" /> {m.trend}
                </span>
              )}
              {"warn" in m && m.warn && (
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              )}
            </div>
            <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      <div className={cn("grid gap-3", !compact && "lg:grid-cols-5")}>
        <div
          className={cn(
            "shadow-soft rounded-xl border bg-card p-4",
            !compact && "lg:col-span-3",
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold">Visitas por semana</p>
              <p className="text-[10px] text-muted-foreground">
                Últimos 7 días
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-mono text-[9px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> en curso
            </span>
          </div>
          <div className="flex h-24 items-end gap-2">
            {BARS.map((h, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-t",
                  i === BARS.length - 2 ? "bg-primary" : "bg-primary/70",
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {!compact && (
          <div className="shadow-soft rounded-xl border bg-card p-4 lg:col-span-2">
            <p className="mb-3 text-xs font-semibold">Actividad reciente</p>
            <ul className="space-y-3">
              {ACTIVITY.map((a) => (
                <li key={a.text} className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[9px] font-semibold text-muted-foreground">
                    {a.who}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          toneDot[a.tone],
                        )}
                      />
                      <span className="truncate text-[11px] text-foreground/80">
                        {a.text}
                      </span>
                    </span>
                    <span className="ml-3 text-[10px] text-muted-foreground">
                      {a.when}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {compact && (
        <div className="shadow-soft flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="text-[11px] font-medium">
            Nueva visita registrada
          </span>
          <span className="text-[10px] text-muted-foreground">
            · hace 2 min
          </span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            BMT-345
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Presentational dashboard mockup — the primary visual of the landing. Marked
 * as an image so assistive tech announces it as a preview instead of reading
 * the demo numbers as content.
 */
export function ProductPreview({
  activeNav = "Resumen",
  main,
  compact = false,
  className,
}: {
  activeNav?: string;
  main?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="Vista previa del panel de administración de Loyalty Web"
      className={cn(
        "shadow-float overflow-hidden rounded-2xl border bg-background ring-1 ring-foreground/[0.04]",
        className,
      )}
    >
      <div aria-hidden className="flex">
        {/* Sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col justify-between border-r bg-card p-3 sm:flex">
          <div>
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Gauge className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold">Loyalty Web</span>
            </div>
            <p className="px-2 pb-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              Principal
            </p>
            <nav className="flex flex-col gap-0.5">
              {NAV.map(({ label, icon: Icon, badge }) => (
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
                  {badge && (
                    <span className="ml-auto rounded-full bg-muted px-1.5 font-mono text-[9px] text-muted-foreground">
                      {badge}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>
          <span className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
            <Settings className="h-3.5 w-3.5" /> Configuración
          </span>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b bg-card px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">Panel</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-semibold">{activeNav}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[10px] text-muted-foreground md:flex">
                <Search className="h-3 w-3" /> Buscar cliente…
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
                <Plus className="h-3 w-3" /> Registrar visita
              </span>
              <span className="h-6 w-6 rounded-full bg-primary/15 ring-1 ring-primary/20" />
            </div>
          </div>
          <div className="bg-muted/40 p-4">
            {main ?? <SummaryPanel compact={compact} />}
          </div>
        </div>
      </div>
    </div>
  );
}
