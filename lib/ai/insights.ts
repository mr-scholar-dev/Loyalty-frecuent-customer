import "server-only";
import {
  getDashboardMetrics,
  listMemberships,
} from "@/lib/loyalty/admin-queries";

/**
 * Business context for the AI features. All reads go through the RLS-scoped
 * admin queries, so everything here is already limited to the caller's org.
 */

const DAY_MS = 86_400_000;

export interface AtRiskCustomer {
  membershipId: string;
  name: string;
  phone: string | null;
  licensePlate: string;
  daysSinceLast: number;
  current: number;
  required: number;
}

/** Active customers who haven't visited in `thresholdDays` (based on their
 * last activity, or their join date if they never returned). */
export async function getAtRiskCustomers(
  nowIso: string,
  thresholdDays = 30,
  limit = 12,
): Promise<AtRiskCustomer[]> {
  const items = await listMemberships({ status: "active" });
  const now = new Date(nowIso).getTime();

  return items
    .map((item) => {
      const ref = item.lastActivityAt ?? item.joinedAt;
      const daysSinceLast = Math.floor((now - new Date(ref).getTime()) / DAY_MS);
      return {
        membershipId: item.id,
        name: item.customerFullName,
        phone: item.phoneNormalized,
        licensePlate: item.licensePlate,
        daysSinceLast,
        current: item.progress.current,
        required: item.progress.required,
      };
    })
    .filter((c) => c.daysSinceLast >= thresholdDays)
    .sort((a, b) => b.daysSinceLast - a.daysSinceLast)
    .slice(0, limit);
}

/** A compact, plain-text snapshot of the business for the LLM prompt. */
export async function getBusinessContext(nowIso: string): Promise<string> {
  const [m, atRisk] = await Promise.all([
    getDashboardMetrics(nowIso),
    getAtRiskCustomers(nowIso),
  ]);

  const fecha = new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    dateStyle: "long",
  }).format(new Date(nowIso));

  return [
    `Datos del servicentro (al ${fecha}):`,
    `- Clientes totales: ${m.totalCustomers}`,
    `- Clientes nuevos este mes: ${m.newCustomersThisMonth}`,
    `- Lavados hoy: ${m.washesToday}`,
    `- Lavados este mes: ${m.washesThisMonth}`,
    `- Recompensas generadas este mes: ${m.rewardsEarnedThisMonth}`,
    `- Recompensas canjeadas este mes: ${m.rewardsRedeemedThisMonth}`,
    `- Recompensas pendientes de canje: ${m.rewardsPending}`,
    `- Clientes a un lavado del premio: ${m.nearReward.length}`,
    `- Clientes en riesgo (sin volver hace 30+ días): ${atRisk.length}`,
  ].join("\n");
}

export interface DashboardCounts {
  totalCustomers: number;
  washesThisMonth: number;
  rewardsPending: number;
  atRisk: number;
}

/** Lightweight numbers to render on the IA page without calling the LLM. */
export async function getAICounts(nowIso: string): Promise<DashboardCounts> {
  const [m, atRisk] = await Promise.all([
    getDashboardMetrics(nowIso),
    getAtRiskCustomers(nowIso),
  ]);
  return {
    totalCustomers: m.totalCustomers,
    washesThisMonth: m.washesThisMonth,
    rewardsPending: m.rewardsPending,
    atRisk: atRisk.length,
  };
}
