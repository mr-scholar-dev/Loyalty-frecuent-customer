import Link from "next/link";
import { Droplets, LogOut } from "lucide-react";
import { getActiveMembership, getCurrentUser } from "@/lib/supabase/auth";
import { logout } from "@/actions/auth";
import { SidebarNav } from "@/components/dashboard/SidebarNav";

/**
 * Admin shell (§15). Shared navigation + signed-in user chip.
 * Route gating (redirect to /login) is enforced in the middleware.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, membership] = await Promise.all([
    getCurrentUser(),
    getActiveMembership(),
  ]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-b bg-card p-3 lg:border-b-0 lg:border-r">
        <Link
          href="/dashboard"
          className="mb-4 hidden items-center gap-2 px-3 pt-2 lg:flex"
        >
          <Droplets className="h-5 w-5 text-primary" aria-hidden />
          <span className="font-bold">Loyalty Web</span>
        </Link>

        <SidebarNav />

        {user && (
          <div className="mt-4 border-t pt-3 lg:mt-auto">
            {membership && (
              <p className="px-3 text-xs font-medium text-muted-foreground">
                {membership.organizationName}
              </p>
            )}
            <div className="flex items-center justify-between gap-2 px-3 py-1">
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {user.email}
                {membership ? ` · ${membership.role}` : ""}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </div>
          </div>
        )}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
