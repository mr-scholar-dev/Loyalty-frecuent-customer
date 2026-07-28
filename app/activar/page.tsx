import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  getActiveMembership,
  getCurrentUser,
  isSuperadmin,
} from "@/lib/supabase/auth";
import { logout } from "@/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { ActivationTour } from "@/components/onboarding/ActivationTour";

export const metadata: Metadata = { title: "Activá tu plan" };
export const dynamic = "force-dynamic";

/**
 * Activation + tour screen. Where the payment gate sends registered owners whose
 * organization has not paid yet. Superadmins and active (paid) orgs are bounced
 * straight to the dashboard.
 */
export default async function ActivarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (await isSuperadmin()) redirect("/dashboard");

  const membership = await getActiveMembership();
  if (membership?.status === "active") redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
        <span className="flex items-center gap-2">
          <BrandMark className="h-8 w-8 shrink-0" />
          <span className="text-[15px] font-semibold tracking-tight">
            Loyalty Web
          </span>
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Salir
          </button>
        </form>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-10 sm:px-6">
        <ActivationTour orgName={membership?.organizationName ?? ""} />
      </main>
    </div>
  );
}
