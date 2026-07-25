"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductPreview, SummaryPanel } from "./ProductPreview";

const CUSTOMERS = [
  { name: "María Rodríguez", plate: "BMT-345", visits: "8", tone: "primary" },
  { name: "Carlos Gómez", plate: "SJO-902", visits: "3", tone: "neutral" },
  { name: "Lucía Méndez", plate: "CTG-118", visits: "9", tone: "success" },
  { name: "Andrés Solís", plate: "ALA-770", visits: "5", tone: "neutral" },
] as const;

const AT_RISK = [
  { name: "José Vargas", days: "41" },
  { name: "Paola Ramírez", days: "36" },
  { name: "Diego Castro", days: "30" },
] as const;

const toneChip: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  neutral: "bg-muted text-muted-foreground",
};

function CustomersPanel() {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="grid grid-cols-[1.4fr_1fr_0.6fr_0.8fr] gap-2 border-b px-2 pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>Cliente</span>
        <span>Placa</span>
        <span>Visitas</span>
        <span>Estado</span>
      </div>
      <ul>
        {CUSTOMERS.map((c) => (
          <li
            key={c.plate}
            className="grid grid-cols-[1.4fr_1fr_0.6fr_0.8fr] items-center gap-2 px-2 py-2.5 text-[11px]"
          >
            <span className="truncate font-medium">{c.name}</span>
            <span className="font-mono text-muted-foreground">{c.plate}</span>
            <span className="font-mono">{c.visits}/9</span>
            <span
              className={cn(
                "w-fit rounded px-1.5 py-0.5 text-[9px] font-medium",
                toneChip[c.tone],
              )}
            >
              {c.tone === "success" ? "Premio" : "Activa"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RetentionPanel() {
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      <div className="rounded-xl border bg-card p-4 lg:col-span-2">
        <p className="text-[11px] text-muted-foreground">
          Clientes por recuperar
        </p>
        <p className="mt-1 font-mono text-3xl font-bold text-warning">18</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          sin visitas hace 30+ días
        </p>
      </div>
      <div className="rounded-xl border bg-card p-4 lg:col-span-3">
        <p className="mb-2 text-xs font-semibold">Prioridad de contacto</p>
        <ul className="space-y-2.5">
          {AT_RISK.map((r) => (
            <li key={r.name} className="flex items-center justify-between">
              <span className="text-[11px] font-medium">{r.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {r.days} días
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const TABS = [
  { id: "Resumen", panel: <SummaryPanel /> },
  { id: "Clientes", panel: <CustomersPanel /> },
  { id: "Retención", panel: <RetentionPanel /> },
] as const;

export function ProductShowcase() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("Resumen");
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section
      id="plataforma"
      className="scroll-mt-20 bg-surface-dark py-20 text-surface-dark-foreground sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Todo tu programa de fidelización, en un solo lugar.
          </h2>
          <p className="mt-4 text-pretty text-surface-dark-foreground/70">
            Consulta clientes, vehículos, visitas, recompensas y actividad
            operativa desde un panel diseñado para trabajar rápido.
          </p>
        </div>

        <div className="mt-8 inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              aria-pressed={active === t.id}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-surface-dark-foreground/70 hover:text-surface-dark-foreground",
              )}
            >
              {t.id}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <ProductPreview activeNav={active} main={current.panel} />
        </div>
      </div>
    </section>
  );
}
