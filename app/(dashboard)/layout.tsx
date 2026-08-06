import Link from "next/link";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { LogOut, ShieldCheck } from "lucide-react";
import {
  getActiveMembership,
  getCurrentUser,
  isSuperadmin,
} from "@/lib/supabase/auth";
import { logout } from "@/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { SectionBreadcrumb } from "@/components/dashboard/SectionBreadcrumb";
import { Copilot } from "@/components/dashboard/Copilot";

/**
 * Admin shell (§15). Shared navigation + signed-in user chip.
 * Route gating (redirect to /login) is enforced in the middleware.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, membership, superadmin] = await Promise.all([
    getCurrentUser(),
    getActiveMembership(),
    isSuperadmin(),
  ]);

  // Defense in depth: the middleware only gates real browser navigations
  // (sec-fetch-dest: document), so also require a session here.
  if (!user) redirect("/login");

  // Payment gate: only superadmins and organizations with an active (paid)
  // subscription reach the app. Everyone else lands on the activation + tour
  // screen until the payment clears (status → active).
  if (!superadmin && membership?.status !== "active") {
    redirect("/activar");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-b bg-muted/50 p-3 lg:border-b-0 lg:border-r">
        <Link
          href="/dashboard"
          className="mb-5 hidden items-center gap-2 px-2 pt-1.5 lg:flex"
        >
          <BrandMark className="h-8 w-8 shrink-0" />
          <span className="text-[15px] font-semibold tracking-tight">
            Loyalty Web
          </span>
        </Link>

        <SidebarNav />

        {superadmin && (
          <Link
            href="/dashboard/admin"
            className="mt-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Superadmin
          </Link>
        )}

        {user && (
          <div className="mt-4 border-t pt-3 lg:mt-auto">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary"
                aria-hidden
              >
                {(membership?.organizationName ?? user.email ?? "?").charAt(0)}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                {membership && (
                  <p className="truncate text-xs font-medium text-foreground">
                    {membership.organizationName}
                  </p>
                )}
                <p className="truncate text-[11px] text-muted-foreground">
                  {user.email}
                  {membership ? ` · ${membership.role}` : ""}
                </p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </div>
          </div>
        )}
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <BrandMark className="h-7 w-7 shrink-0" />
            <span className="text-sm font-semibold">Loyalty Web</span>
          </Link>
          <SectionBreadcrumb />
          <Copilot />
        </header>
        <div className="content-stagger flex-1">{children}</div>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
