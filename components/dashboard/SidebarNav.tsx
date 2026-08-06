"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  Download,
  Gift,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  QrCode,
  ScanLine,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/scan", label: "Escanear", icon: ScanLine },
      { href: "/dashboard/qr", label: "QR registro", icon: QrCode },
    ],
  },
  {
    label: "Gestión",
    items: [
      { href: "/dashboard/customers", label: "Clientes", icon: Users },
      { href: "/dashboard/team", label: "Equipo", icon: UsersRound },
      { href: "/dashboard/kanban", label: "Kanban", icon: KanbanSquare },
      { href: "/dashboard/ia" as Route, label: "Asistente IA", icon: Sparkles },
    ],
  },
  {
    label: "Análisis",
    items: [
      { href: "/dashboard/visits", label: "Visitas", icon: ListChecks },
      { href: "/dashboard/audit", label: "Auditoría", icon: ScrollText },
      { href: "/dashboard/exports", label: "Exportar", icon: Download },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/dashboard/branches", label: "Sucursales", icon: Building2 },
      { href: "/dashboard/program", label: "Programa", icon: Gift },
      { href: "/dashboard/billing", label: "Facturación", icon: CreditCard },
      { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Secciones"
      className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible"
    >
      {GROUPS.map((group) => (
        // `contents` keeps items in the horizontal flow on mobile; on desktop
        // the wrapper restores block layout so groups + labels stack.
        <div
          key={group.label}
          className="contents lg:mt-5 lg:block lg:first:mt-0"
        >
          <p className="hidden px-3 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70 lg:block">
            {group.label}
          </p>
          {group.items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:my-0.5",
                  active
                    ? "bg-card text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-1/2 hidden h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity lg:block",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground/80 group-hover:text-foreground",
                  )}
                  aria-hidden
                />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
