"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Download,
  Gift,
  LayoutDashboard,
  ListChecks,
  QrCode,
  ScanLine,
  ScrollText,
  Settings,
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

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/scan", label: "Escanear", icon: ScanLine },
  { href: "/dashboard/qr", label: "QR registro", icon: QrCode },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/team", label: "Equipo", icon: UsersRound },
  { href: "/dashboard/visits", label: "Visitas", icon: ListChecks },
  { href: "/dashboard/audit", label: "Auditoría", icon: ScrollText },
  { href: "/dashboard/exports", label: "Exportar", icon: Download },
  { href: "/dashboard/branches", label: "Sucursales", icon: Building2 },
  { href: "/dashboard/program", label: "Programa", icon: Gift },
  { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
