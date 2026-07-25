"use client";

import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/scan": "Escanear",
  "/dashboard/qr": "QR de registro",
  "/dashboard/customers": "Clientes",
  "/dashboard/team": "Equipo",
  "/dashboard/kanban": "Kanban",
  "/dashboard/ia": "Asistente IA",
  "/dashboard/visits": "Visitas",
  "/dashboard/audit": "Auditoría",
  "/dashboard/exports": "Exportar",
  "/dashboard/branches": "Sucursales",
  "/dashboard/program": "Programa",
  "/dashboard/billing": "Facturación",
  "/dashboard/settings": "Ajustes",
};

const KEYS = Object.keys(LABELS).sort((a, b) => b.length - a.length);

function resolve(pathname: string): { section: string; detail: boolean } {
  const key = KEYS.find((k) => pathname === k || pathname.startsWith(`${k}/`));
  if (!key) return { section: "Panel", detail: false };
  return {
    section: LABELS[key] ?? "Panel",
    detail: pathname !== key && key !== "/dashboard",
  };
}

/** Shows the current section in the dashboard top bar — "Panel / Clientes". */
export function SectionBreadcrumb() {
  const pathname = usePathname();
  const { section, detail } = resolve(pathname);

  return (
    <nav
      aria-label="Ubicación"
      className="hidden items-center gap-1.5 text-sm lg:flex"
    >
      <span className="text-muted-foreground">Panel</span>
      <span className="text-muted-foreground/40" aria-hidden>
        /
      </span>
      <span className="font-medium text-foreground">{section}</span>
      {detail && (
        <>
          <span className="text-muted-foreground/40" aria-hidden>
            /
          </span>
          <span className="text-muted-foreground">Detalle</span>
        </>
      )}
    </nav>
  );
}
