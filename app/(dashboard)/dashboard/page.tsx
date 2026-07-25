import type { Metadata } from "next";
import Link from "next/link";
import {
  Droplets,
  Gift,
  ScanLine,
  Trophy,
  Users,
  UserPlus,
} from "lucide-react";
import { LoyaltyEventType } from "@/types/domain";
import {
  getDashboardMetrics,
  type RecentActivityItem,
} from "@/lib/loyalty/admin-queries";
import { EVENT_LABELS, formatDateTimeCR } from "@/lib/loyalty/event-format";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Reflects live data on each request.
export const dynamic = "force-dynamic";

function ActivityRow({ item }: { item: RecentActivityItem }) {
  const isReward =
    item.type === LoyaltyEventType.RewardEarned ||
    item.type === LoyaltyEventType.RewardRedeemed;
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isReward ? "bg-warning/10 text-warning" : "bg-info/10 text-info",
          )}
        >
          {isReward ? (
            <Gift className="h-4 w-4" aria-hidden />
          ) : (
            <Droplets className="h-4 w-4" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {EVENT_LABELS[item.type]}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {item.customerName} · {item.licensePlate}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDateTimeCR(item.at)}
      </span>
    </li>
  );
}

/**
 * Admin dashboard (§15). Metrics are projected from the in-memory demo store;
 * they become real, RLS-scoped queries in the database phase.
 */
export default async function DashboardPage() {
  const metrics = await getDashboardMetrics(new Date().toISOString());
  const hasCustomers = metrics.totalCustomers > 0;
  const hasVisits = metrics.recentActivity.length > 0;
  const fullyOnboarded = hasCustomers && hasVisits;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen de actividad del programa de fidelización.
          </p>
        </div>
        <Link
          href="/dashboard/scan"
          className={cn(buttonVariants({ size: "default" }))}
        >
          <ScanLine aria-hidden /> Escanear tarjeta
        </Link>
      </div>

      {!fullyOnboarded && (
        <div className="mb-6">
          <OnboardingChecklist
            hasCustomers={hasCustomers}
            hasVisits={hasVisits}
          />
        </div>
      )}

      {/* A brand-new account sees only the guided setup — no empty metrics. */}
      {!hasCustomers ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Clientes totales"
              value={metrics.totalCustomers}
              icon={Users}
            />
            <MetricCard
              label="Nuevos este mes"
              value={metrics.newCustomersThisMonth}
              icon={UserPlus}
            />
            <MetricCard
              label="Lavados hoy"
              value={metrics.washesToday}
              icon={Droplets}
              hint={`${metrics.washesThisMonth} este mes`}
            />
            <MetricCard
              label="Recompensas pendientes"
              value={metrics.rewardsPending}
              icon={Gift}
            />
            <MetricCard
              label="Recompensas generadas"
              value={metrics.rewardsEarnedThisMonth}
              icon={Trophy}
              hint="este mes"
            />
            <MetricCard
              label="Recompensas canjeadas"
              value={metrics.rewardsRedeemedThisMonth}
              icon={Gift}
              hint="este mes"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actividad reciente</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.recentActivity.length > 0 ? (
                  <ul className="divide-y">
                    {metrics.recentActivity.map((item, i) => (
                      <ActivityRow key={i} item={item} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={Droplets}
                    title="Sin actividad todavía"
                    description="Registra un lavado para ver aquí el movimiento del programa."
                    action={{
                      label: "Escanear tarjeta",
                      href: "/dashboard/scan",
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  A una visita del premio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.nearReward.length > 0 ? (
                  <ul className="divide-y">
                    {metrics.nearReward.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {item.customerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.licensePlate}
                          </p>
                        </div>
                        <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                          {item.current}/{item.required}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={Trophy}
                    title="Nadie está cerca del premio"
                    description="Cuando un cliente esté a un lavado de su recompensa, aparecerá aquí."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Métricas en vivo de tu organización (bajo RLS).
          </p>
        </>
      )}
    </main>
  );
}
