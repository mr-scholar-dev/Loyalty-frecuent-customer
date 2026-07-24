import Link from "next/link";
import { Droplets } from "lucide-react";
import { SidebarNav } from "@/components/dashboard/SidebarNav";

/**
 * Admin shell (§15). Shared navigation for all dashboard pages.
 *
 * NOTE: not yet auth-gated. Session + role gating are added with the deferred
 * auth phase (middleware + server checks).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b bg-card p-3 lg:border-b-0 lg:border-r">
        <Link
          href="/dashboard"
          className="mb-4 hidden items-center gap-2 px-3 pt-2 lg:flex"
        >
          <Droplets className="h-5 w-5 text-primary" aria-hidden />
          <span className="font-bold">Loyalty Web</span>
        </Link>
        <SidebarNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
