import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getProgressView, type ProgressView } from "@/lib/loyalty/progress";
import { LoyaltyEventType, type MembershipStatus } from "@/types/domain";

/**
 * Admin/dashboard reads, all under the signed-in employee's session (RLS →
 * automatically scoped to their organization). Aggregations are computed in JS
 * over RLS-scoped rows; fine for the current scale, revisit with SQL views if
 * data grows.
 */

// --- date helpers (Costa Rica) ----------------------------------------------
function crParts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(iso))
    .split("-")
    .map(Number);
  return { y: y ?? 0, m: m ?? 0, d: d ?? 0 };
}

// --- shared types -----------------------------------------------------------
export interface RecentActivityItem {
  type: LoyaltyEventType;
  customerName: string;
  licensePlate: string;
  organizationName: string;
  at: string;
}
export interface NearRewardItem {
  customerName: string;
  licensePlate: string;
  current: number;
  required: number;
}
export interface DashboardMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  washesToday: number;
  washesThisMonth: number;
  rewardsEarnedThisMonth: number;
  rewardsRedeemedThisMonth: number;
  rewardsPending: number;
  recentActivity: RecentActivityItem[];
  nearReward: NearRewardItem[];
}

export interface AdminListItem {
  id: string;
  customerFullName: string;
  phoneNormalized: string | null;
  licensePlate: string;
  organizationName: string;
  status: MembershipStatus;
  progress: ProgressView;
  joinedAt: string;
  lastActivityAt: string | null;
}
export interface ListFilters {
  query?: string;
  status?: MembershipStatus | "all";
}
export interface MembershipDetail extends AdminListItem {
  tokenPrefix: string;
  events: { type: LoyaltyEventType; at: string }[];
}

export interface VisitLogItem {
  type: LoyaltyEventType;
  customerFullName: string;
  licensePlate: string;
  organizationName: string;
  at: string;
}
export interface AuditEntry {
  action: string;
  detail: string;
  at: string;
}

// --- internal: load org-scoped rows and index them --------------------------
interface Loaded {
  customers: Map<
    string,
    { full_name: string; phone_normalized: string | null; created_at: string }
  >;
  vehicles: Map<
    string,
    { customer_id: string; license_plate_normalized: string }
  >;
  orgNameById: Map<string, string>;
  memberships: {
    id: string;
    status: string;
    organization_id: string;
    customer_id: string;
    vehicle_id: string;
    joined_at: string;
    last_activity_at: string | null;
    public_token_prefix: string;
  }[];
  balances: Map<
    string,
    { paid_visits_in_cycle: number; available_rewards: number }
  >;
  programRequired: number;
  rewardQuantity: number;
}

async function load(): Promise<Loaded> {
  const supabase = await createClient();
  const [
    { data: customers },
    { data: vehicles },
    { data: orgs },
    { data: memberships },
    { data: balances },
    { data: program },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone_normalized, created_at"),
    supabase
      .from("vehicles")
      .select("id, customer_id, license_plate_normalized"),
    supabase.from("organizations").select("id, name"),
    supabase
      .from("memberships")
      .select(
        "id, status, organization_id, customer_id, vehicle_id, joined_at, last_activity_at, public_token_prefix",
      ),
    supabase
      .from("membership_balances")
      .select("membership_id, paid_visits_in_cycle, available_rewards"),
    supabase
      .from("loyalty_programs")
      .select("paid_visits_required, reward_quantity")
      .eq("status", "active")
      .maybeSingle(),
  ]);

  return {
    customers: new Map((customers ?? []).map((c) => [c.id, c])),
    vehicles: new Map((vehicles ?? []).map((v) => [v.id, v])),
    orgNameById: new Map((orgs ?? []).map((o) => [o.id, o.name])),
    memberships: memberships ?? [],
    balances: new Map((balances ?? []).map((b) => [b.membership_id, b])),
    programRequired: program?.paid_visits_required ?? 9,
    rewardQuantity: program?.reward_quantity ?? 1,
  };
}

function progressFor(l: Loaded, membershipId: string): ProgressView {
  const b = l.balances.get(membershipId);
  return getProgressView(
    {
      paidVisitsInCycle: b?.paid_visits_in_cycle ?? 0,
      availableRewards: b?.available_rewards ?? 0,
    },
    { paidVisitsRequired: l.programRequired, rewardQuantity: l.rewardQuantity },
  );
}

function toAdminItem(
  l: Loaded,
  m: Loaded["memberships"][number],
): AdminListItem {
  const customer = l.customers.get(m.customer_id);
  const vehicle = l.vehicles.get(m.vehicle_id);
  return {
    id: m.id,
    customerFullName: customer?.full_name ?? "—",
    phoneNormalized: customer?.phone_normalized ?? null,
    licensePlate: vehicle?.license_plate_normalized ?? "—",
    organizationName: l.orgNameById.get(m.organization_id) ?? "—",
    status: m.status as MembershipStatus,
    progress: progressFor(l, m.id),
    joinedAt: m.joined_at,
    lastActivityAt: m.last_activity_at,
  };
}

// --- dashboard --------------------------------------------------------------
export async function getDashboardMetrics(
  nowIso: string,
): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const l = await load();
  const { data: events } = await supabase
    .from("loyalty_events")
    .select("event_type, created_at, membership_id")
    .order("created_at", { ascending: false });
  const evts = events ?? [];

  const today = crParts(nowIso);
  const sameDay = (iso: string) => {
    const p = crParts(iso);
    return p.y === today.y && p.m === today.m && p.d === today.d;
  };
  const sameMonth = (iso: string) => {
    const p = crParts(iso);
    return p.y === today.y && p.m === today.m;
  };
  const countEv = (type: LoyaltyEventType, when: (iso: string) => boolean) =>
    evts.filter((e) => e.event_type === type && when(e.created_at)).length;

  const recentActivity: RecentActivityItem[] = evts.slice(0, 8).map((e) => {
    const m = l.memberships.find((x) => x.id === e.membership_id);
    const customer = m ? l.customers.get(m.customer_id) : undefined;
    const vehicle = m ? l.vehicles.get(m.vehicle_id) : undefined;
    return {
      type: e.event_type as LoyaltyEventType,
      customerName: customer?.full_name ?? "—",
      licensePlate: vehicle?.license_plate_normalized ?? "—",
      organizationName: m ? (l.orgNameById.get(m.organization_id) ?? "—") : "—",
      at: e.created_at,
    };
  });

  const nearReward: NearRewardItem[] = l.memberships
    .filter(
      (m) =>
        m.status === "active" &&
        (l.balances.get(m.id)?.paid_visits_in_cycle ?? 0) ===
          l.programRequired - 1,
    )
    .map((m) => {
      const customer = l.customers.get(m.customer_id);
      const vehicle = l.vehicles.get(m.vehicle_id);
      return {
        customerName: customer?.full_name ?? "—",
        licensePlate: vehicle?.license_plate_normalized ?? "—",
        current: l.balances.get(m.id)?.paid_visits_in_cycle ?? 0,
        required: l.programRequired,
      };
    });

  return {
    totalCustomers: l.customers.size,
    newCustomersThisMonth: [...l.customers.values()].filter((c) =>
      sameMonth(c.created_at),
    ).length,
    washesToday: countEv(LoyaltyEventType.VisitEarned, sameDay),
    washesThisMonth: countEv(LoyaltyEventType.VisitEarned, sameMonth),
    rewardsEarnedThisMonth: countEv(LoyaltyEventType.RewardEarned, sameMonth),
    rewardsRedeemedThisMonth: countEv(
      LoyaltyEventType.RewardRedeemed,
      sameMonth,
    ),
    rewardsPending: [...l.balances.values()].reduce(
      (sum, b) => sum + b.available_rewards,
      0,
    ),
    recentActivity,
    nearReward,
  };
}

// --- customers list ---------------------------------------------------------
export async function listMemberships(
  filters: ListFilters = {},
): Promise<AdminListItem[]> {
  const l = await load();
  const q = filters.query?.trim().toLowerCase();
  const status = filters.status ?? "all";
  return l.memberships
    .filter((m) => (status === "all" ? true : m.status === status))
    .map((m) => toAdminItem(l, m))
    .filter((item) => {
      if (!q) return true;
      return (
        item.customerFullName.toLowerCase().includes(q) ||
        item.licensePlate.toLowerCase().includes(q) ||
        (item.phoneNormalized?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => (a.customerFullName < b.customerFullName ? -1 : 1));
}

// --- customer detail --------------------------------------------------------
export async function getMembershipDetail(
  id: string,
): Promise<MembershipDetail | null> {
  const supabase = await createClient();
  const l = await load();
  const m = l.memberships.find((x) => x.id === id);
  if (!m) return null;

  const { data: events } = await supabase
    .from("loyalty_events")
    .select("event_type, created_at")
    .eq("membership_id", id)
    .order("created_at", { ascending: false });

  return {
    ...toAdminItem(l, m),
    tokenPrefix: m.public_token_prefix,
    events: (events ?? []).map((e) => ({
      type: e.event_type as LoyaltyEventType,
      at: e.created_at,
    })),
  };
}

// --- visits log -------------------------------------------------------------
export async function getVisitLog(): Promise<VisitLogItem[]> {
  const supabase = await createClient();
  const l = await load();
  const { data: events } = await supabase
    .from("loyalty_events")
    .select("event_type, created_at, membership_id")
    .in("event_type", [
      LoyaltyEventType.VisitEarned,
      LoyaltyEventType.VisitReversed,
    ])
    .order("created_at", { ascending: false });

  return (events ?? []).map((e) => {
    const m = l.memberships.find((x) => x.id === e.membership_id);
    const customer = m ? l.customers.get(m.customer_id) : undefined;
    const vehicle = m ? l.vehicles.get(m.vehicle_id) : undefined;
    return {
      type: e.event_type as LoyaltyEventType,
      customerFullName: customer?.full_name ?? "—",
      licensePlate: vehicle?.license_plate_normalized ?? "—",
      organizationName: m ? (l.orgNameById.get(m.organization_id) ?? "—") : "—",
      at: e.created_at,
    };
  });
}

// --- audit log --------------------------------------------------------------
function auditDetail(action: string, after: unknown): string {
  if (after && typeof after === "object") {
    const a = after as Record<string, unknown>;
    if (typeof a.reason === "string") return `Motivo: ${a.reason}`;
    if (typeof a.note === "string") return a.note;
    if (a.reward_earned === true) return "Recompensa generada";
  }
  if (action === "visit.register") return "Lavado registrado";
  if (action === "reward.redeem") return "Recompensa canjeada";
  return "";
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("action, after_data, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).map((a) => ({
    action: a.action,
    detail: auditDetail(a.action, a.after_data),
    at: a.created_at,
  }));
}

// --- CSV export -------------------------------------------------------------
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: (string | number)[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export async function customersCsv(): Promise<string> {
  const l = await load();
  const rows = l.memberships.map((m) => {
    const customer = l.customers.get(m.customer_id);
    const vehicle = l.vehicles.get(m.vehicle_id);
    const b = l.balances.get(m.id);
    return [
      customer?.full_name ?? "",
      customer?.phone_normalized ?? "",
      vehicle?.license_plate_normalized ?? "",
      l.orgNameById.get(m.organization_id) ?? "",
      m.status,
      b?.paid_visits_in_cycle ?? 0,
      b?.available_rewards ?? 0,
      m.joined_at,
    ];
  });
  return toCsv(
    [
      "cliente",
      "telefono",
      "placa",
      "organizacion",
      "estado",
      "visitas_ciclo",
      "recompensas",
      "alta",
    ],
    rows,
  );
}

export async function visitsCsv(): Promise<string> {
  const visits = await getVisitLog();
  return toCsv(
    ["fecha", "tipo", "cliente", "placa", "organizacion"],
    visits.map((v) => [
      v.at,
      v.type,
      v.customerFullName,
      v.licensePlate,
      v.organizationName,
    ]),
  );
}
