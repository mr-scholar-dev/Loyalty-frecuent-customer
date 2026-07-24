/**
 * In-memory demo store for enrollments and visits, while the database layer is
 * deferred.
 *
 * TEMPORARY / DEV-ONLY: state lives in the Node process and is lost on restart;
 * it does NOT work across serverless instances. It exists so the enrollment ->
 * card -> scan -> register-visit -> reward flow is fully demoable without
 * Supabase. Replace with real, transactional, RLS-protected persistence and the
 * `register_paid_visit` / `redeem_reward` RPCs in the database phase.
 */

import { LoyaltyEventType, MembershipStatus } from "@/types/domain";
import {
  buildCardUrl,
  getProgressView,
  maskCustomerName,
  type CardView,
  type OrganizationBrand,
} from "@/lib/loyalty/card";
import {
  applyPaidVisit,
  applyRedeemReward,
  DEFAULT_PROGRAM,
} from "@/lib/loyalty/progress";
import { SAMPLE_SEEDS, type MembershipRecord } from "@/lib/loyalty/sample";
import { generatePublicToken } from "@/lib/security/token";

/**
 * Anchored on `globalThis` so the same state is shared across the separately
 * bundled server-action and RSC module instances in Next dev (the standard
 * dev-singleton pattern). Still process-local — see the file header caveat.
 */
interface EventRecord {
  type: LoyaltyEventType;
  token: string;
  at: string;
}

export interface AuditEntry {
  action: string;
  entityId: string;
  detail: string;
  at: string;
}

const globalForStore = globalThis as typeof globalThis & {
  __loyaltyDemoStore?: Map<string, MembershipRecord>;
  __loyaltyIdempotencyKeys?: Set<string>;
  __loyaltyEvents?: EventRecord[];
  __loyaltyAudit?: AuditEntry[];
};

function seedStore(): Map<string, MembershipRecord> {
  const map = new Map<string, MembershipRecord>();
  for (const [token, seed] of Object.entries(SAMPLE_SEEDS)) {
    map.set(token, { ...seed, organization: { ...seed.organization } });
  }
  return map;
}

/**
 * Seed a small, realistic-looking event history (relative to server "now") so
 * the demo dashboard is populated. DEMO-ONLY; the real ledger is the DB.
 */
function seedEvents(): EventRecord[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const at = (daysAgo: number) => new Date(now - daysAgo * day).toISOString();
  const V = LoyaltyEventType.VisitEarned;
  return [
    { type: V, token: "demo", at: at(0) },
    { type: V, token: "demo-reward", at: at(0) },
    { type: V, token: "demo", at: at(1) },
    { type: LoyaltyEventType.RewardRedeemed, token: "demo-reward", at: at(1) },
    { type: V, token: "demo-blocked", at: at(2) },
    { type: V, token: "demo", at: at(4) },
    { type: LoyaltyEventType.RewardEarned, token: "demo", at: at(4) },
    { type: V, token: "demo-reward", at: at(6) },
    { type: V, token: "demo", at: at(9) },
  ];
}

const store: Map<string, MembershipRecord> =
  globalForStore.__loyaltyDemoStore ??
  (globalForStore.__loyaltyDemoStore = seedStore());

/** Idempotency keys already processed (§12) — prevents double-processing. */
const processedKeys: Set<string> =
  globalForStore.__loyaltyIdempotencyKeys ??
  (globalForStore.__loyaltyIdempotencyKeys = new Set<string>());

/** Append-only event ledger (projection source). DEMO-ONLY. */
const events: EventRecord[] =
  globalForStore.__loyaltyEvents ??
  (globalForStore.__loyaltyEvents = seedEvents());

/** Audit log of administrative actions (§17). DEMO-ONLY. */
const audit: AuditEntry[] =
  globalForStore.__loyaltyAudit ?? (globalForStore.__loyaltyAudit = []);

function recordAudit(
  action: string,
  entityId: string,
  detail: string,
  at: string,
): void {
  audit.push({ action, entityId, detail, at });
}

export interface CreateMembershipInput {
  organization: OrganizationBrand;
  customerFullName: string;
  /** Normalized phone (optional; used for admin search). */
  phoneNormalized?: string | null;
  /** Normalized license plate. */
  licensePlate: string;
  /** ISO timestamp (server-provided). */
  joinedAt: string;
}

/** Create a demo membership and return its public token. */
export function createDemoMembership(input: CreateMembershipInput): string {
  const token = generatePublicToken();
  store.set(token, {
    organization: input.organization,
    customerFullName: input.customerFullName,
    phoneNormalized: input.phoneNormalized ?? null,
    licensePlate: input.licensePlate,
    paidVisitsInCycle: 0,
    availableRewards: 0,
    status: MembershipStatus.Active,
    joinedAt: input.joinedAt,
    lastActivityAt: null,
  });
  return token;
}

function toCardView(token: string, m: MembershipRecord): CardView {
  return {
    organization: m.organization,
    customerDisplayName: maskCustomerName(m.customerFullName),
    licensePlate: m.licensePlate,
    status: m.status,
    progress: getProgressView({
      paidVisitsInCycle: m.paidVisitsInCycle,
      availableRewards: m.availableRewards,
    }),
    cardUrl: buildCardUrl(token),
    lastActivityAt: m.lastActivityAt,
  };
}

/** Safe public card view by token, or null when unknown. */
export function resolveCardView(token: string): CardView | null {
  const record = store.get(token);
  return record ? toCardView(token, record) : null;
}

/** Fuller view for authenticated staff (unmasked name). Demo-only. */
export interface StaffMembershipView {
  token: string;
  organizationName: string;
  customerFullName: string;
  licensePlate: string;
  status: MembershipStatus;
  progress: CardView["progress"];
  lastActivityAt: string | null;
}

function toStaffView(token: string, m: MembershipRecord): StaffMembershipView {
  return {
    token,
    organizationName: m.organization.name,
    customerFullName: m.customerFullName,
    licensePlate: m.licensePlate,
    status: m.status,
    progress: getProgressView({
      paidVisitsInCycle: m.paidVisitsInCycle,
      availableRewards: m.availableRewards,
    }),
    lastActivityAt: m.lastActivityAt,
  };
}

/** Look up a membership for staff by token, or null when unknown. */
export function getStaffView(token: string): StaffMembershipView | null {
  const record = store.get(token);
  return record ? toStaffView(token, record) : null;
}

export type MutationResult =
  | { ok: true; view: StaffMembershipView; rewardEarned?: boolean }
  | {
      ok: false;
      reason: "not_found" | "blocked" | "no_reward" | "duplicate";
    };

/** Extract a token from a scanned value (a card URL or a raw token). */
export function parseScannedToken(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/\/c\/([^/?#\s]+)/);
  return match?.[1] ?? trimmed;
}

/**
 * Register a paid visit (mirrors `register_paid_visit`): idempotent, refuses
 * blocked memberships, grants a reward on cycle completion.
 */
export function registerVisit(
  token: string,
  idempotencyKey: string,
  now: string,
): MutationResult {
  const record = store.get(token);
  if (!record) return { ok: false, reason: "not_found" };
  if (record.status !== MembershipStatus.Active) {
    return { ok: false, reason: "blocked" };
  }
  if (processedKeys.has(idempotencyKey)) {
    return { ok: false, reason: "duplicate" };
  }

  const { balance, rewardEarned } = applyPaidVisit(
    {
      paidVisitsInCycle: record.paidVisitsInCycle,
      availableRewards: record.availableRewards,
    },
    DEFAULT_PROGRAM,
  );
  record.paidVisitsInCycle = balance.paidVisitsInCycle;
  record.availableRewards = balance.availableRewards;
  record.lastActivityAt = now;
  processedKeys.add(idempotencyKey);
  events.push({ type: LoyaltyEventType.VisitEarned, token, at: now });
  if (rewardEarned) {
    events.push({ type: LoyaltyEventType.RewardEarned, token, at: now });
  }

  return { ok: true, view: toStaffView(token, record), rewardEarned };
}

/** Redeem one reward (mirrors `redeem_reward`): idempotent, needs a reward. */
export function redeemReward(
  token: string,
  idempotencyKey: string,
  now: string,
): MutationResult {
  const record = store.get(token);
  if (!record) return { ok: false, reason: "not_found" };
  if (record.status !== MembershipStatus.Active) {
    return { ok: false, reason: "blocked" };
  }
  if (record.availableRewards < 1) {
    return { ok: false, reason: "no_reward" };
  }
  if (processedKeys.has(idempotencyKey)) {
    return { ok: false, reason: "duplicate" };
  }

  const balance = applyRedeemReward({
    paidVisitsInCycle: record.paidVisitsInCycle,
    availableRewards: record.availableRewards,
  });
  record.availableRewards = balance.availableRewards;
  record.lastActivityAt = now;
  processedKeys.add(idempotencyKey);
  events.push({ type: LoyaltyEventType.RewardRedeemed, token, at: now });

  return { ok: true, view: toStaffView(token, record) };
}

// ---------------------------------------------------------------------------
// Dashboard metrics (§15) — projected from the demo store + event ledger.
// ---------------------------------------------------------------------------

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

function crParts(iso: string): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(new Date(iso)).split("-").map(Number);
  return { y: y ?? 0, m: m ?? 0, d: d ?? 0 };
}

/** Aggregate metrics for the admin dashboard. `nowIso` is server-provided. */
export function getDashboardMetrics(nowIso: string): DashboardMetrics {
  const today = crParts(nowIso);
  const isToday = (iso: string) => {
    const p = crParts(iso);
    return p.y === today.y && p.m === today.m && p.d === today.d;
  };
  const isThisMonth = (iso: string) => {
    const p = crParts(iso);
    return p.y === today.y && p.m === today.m;
  };

  const memberships = [...store.entries()];
  const required = DEFAULT_PROGRAM.paidVisitsRequired;

  const recentActivity: RecentActivityItem[] = [...events]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8)
    .map((e) => {
      const m = store.get(e.token);
      return {
        type: e.type,
        customerName: m?.customerFullName ?? "—",
        licensePlate: m?.licensePlate ?? "—",
        organizationName: m?.organization.name ?? "—",
        at: e.at,
      };
    });

  const nearReward: NearRewardItem[] = memberships
    .filter(
      ([, m]) =>
        m.status === MembershipStatus.Active &&
        m.paidVisitsInCycle === required - 1,
    )
    .map(([, m]) => ({
      customerName: m.customerFullName,
      licensePlate: m.licensePlate,
      current: m.paidVisitsInCycle,
      required,
    }));

  return {
    totalCustomers: memberships.length,
    newCustomersThisMonth: memberships.filter(([, m]) =>
      isThisMonth(m.joinedAt),
    ).length,
    washesToday: events.filter(
      (e) => e.type === LoyaltyEventType.VisitEarned && isToday(e.at),
    ).length,
    washesThisMonth: events.filter(
      (e) => e.type === LoyaltyEventType.VisitEarned && isThisMonth(e.at),
    ).length,
    rewardsEarnedThisMonth: events.filter(
      (e) => e.type === LoyaltyEventType.RewardEarned && isThisMonth(e.at),
    ).length,
    rewardsRedeemedThisMonth: events.filter(
      (e) => e.type === LoyaltyEventType.RewardRedeemed && isThisMonth(e.at),
    ).length,
    rewardsPending: memberships.reduce(
      (sum, [, m]) => sum + m.availableRewards,
      0,
    ),
    recentActivity,
    nearReward,
  };
}

// ---------------------------------------------------------------------------
// Admin — customer management (§7 Fase 7). Demo store backed.
// ---------------------------------------------------------------------------

export interface AdminListItem {
  id: string;
  customerFullName: string;
  phoneNormalized: string | null;
  licensePlate: string;
  organizationName: string;
  status: MembershipStatus;
  progress: CardView["progress"];
  joinedAt: string;
  lastActivityAt: string | null;
}

function toAdminItem(token: string, m: MembershipRecord): AdminListItem {
  return {
    id: token,
    customerFullName: m.customerFullName,
    phoneNormalized: m.phoneNormalized,
    licensePlate: m.licensePlate,
    organizationName: m.organization.name,
    status: m.status,
    progress: getProgressView({
      paidVisitsInCycle: m.paidVisitsInCycle,
      availableRewards: m.availableRewards,
    }),
    joinedAt: m.joinedAt,
    lastActivityAt: m.lastActivityAt,
  };
}

export interface ListFilters {
  /** Free-text search over name, phone or plate. */
  query?: string;
  status?: MembershipStatus | "all";
}

/** List memberships for the admin table (search by name/phone/plate). */
export function listMemberships(filters: ListFilters = {}): AdminListItem[] {
  const q = filters.query?.trim().toLowerCase();
  const status = filters.status ?? "all";
  return [...store.entries()]
    .filter(([, m]) => (status === "all" ? true : m.status === status))
    .filter(([, m]) => {
      if (!q) return true;
      return (
        m.customerFullName.toLowerCase().includes(q) ||
        m.licensePlate.toLowerCase().includes(q) ||
        (m.phoneNormalized?.toLowerCase().includes(q) ?? false)
      );
    })
    .map(([token, m]) => toAdminItem(token, m))
    .sort((a, b) => (a.customerFullName < b.customerFullName ? -1 : 1));
}

export interface MembershipDetail extends AdminListItem {
  cardUrl: string;
  events: EventRecord[];
}

/** Full membership detail incl. its event ledger, or null when unknown. */
export function getMembershipDetail(token: string): MembershipDetail | null {
  const m = store.get(token);
  if (!m) return null;
  return {
    ...toAdminItem(token, m),
    cardUrl: buildCardUrl(token),
    events: events
      .filter((e) => e.token === token)
      .sort((a, b) => (a.at < b.at ? 1 : -1)),
  };
}

export type AdminResult =
  | { ok: true; detail: MembershipDetail }
  | { ok: false; reason: "not_found" | "invalid_state" | "reason_required" };

/** Block a membership (§12/§17). */
export function blockMembership(token: string, now: string): AdminResult {
  const m = store.get(token);
  if (!m) return { ok: false, reason: "not_found" };
  m.status = MembershipStatus.Blocked;
  recordAudit("membership.block", token, "Tarjeta bloqueada", now);
  return { ok: true, detail: getMembershipDetail(token)! };
}

/** Reactivate a blocked membership. */
export function reactivateMembership(token: string, now: string): AdminResult {
  const m = store.get(token);
  if (!m) return { ok: false, reason: "not_found" };
  m.status = MembershipStatus.Active;
  recordAudit("membership.reactivate", token, "Tarjeta reactivada", now);
  return { ok: true, detail: getMembershipDetail(token)! };
}

export type ReissueResult =
  { ok: true; newToken: string } | { ok: false; reason: "not_found" };

/**
 * Reissue a card: mint a new token and invalidate the previous one (§13).
 * The old token is removed so `/c/{oldToken}` stops resolving (revocation).
 */
export function reissueCard(token: string, now: string): ReissueResult {
  const m = store.get(token);
  if (!m) return { ok: false, reason: "not_found" };
  const newToken = generatePublicToken();
  store.delete(token);
  store.set(newToken, m);
  // Re-point this membership's events at the new token.
  for (const e of events) {
    if (e.token === token) e.token = newToken;
  }
  recordAudit(
    "membership.reissue",
    newToken,
    `Tarjeta reemitida (token anterior revocado: ${token.slice(0, 8)}…)`,
    now,
  );
  return { ok: true, newToken };
}

/**
 * Reverse the most recent paid visit (§Flujo G): never deletes events — appends
 * a `visit_reversed` event and decrements the cycle. Requires a reason.
 */
export function reverseLastVisit(
  token: string,
  reason: string,
  now: string,
): AdminResult {
  const m = store.get(token);
  if (!m) return { ok: false, reason: "not_found" };
  if (!reason.trim()) return { ok: false, reason: "reason_required" };
  if (m.paidVisitsInCycle < 1) return { ok: false, reason: "invalid_state" };

  m.paidVisitsInCycle -= 1;
  m.lastActivityAt = now;
  events.push({ type: LoyaltyEventType.VisitReversed, token, at: now });
  recordAudit(
    "visit.reverse",
    token,
    `Lavado revertido. Motivo: ${reason.trim()}`,
    now,
  );
  return { ok: true, detail: getMembershipDetail(token)! };
}

/** Audit log, most recent first (§17). */
export function getAuditLog(): AuditEntry[] {
  return [...audit].sort((a, b) => (a.at < b.at ? 1 : -1));
}

/** All visit-related events for the visits page, most recent first. */
export interface VisitLogItem {
  type: LoyaltyEventType;
  customerFullName: string;
  licensePlate: string;
  organizationName: string;
  at: string;
}

export function getVisitLog(): VisitLogItem[] {
  return [...events]
    .filter(
      (e) =>
        e.type === LoyaltyEventType.VisitEarned ||
        e.type === LoyaltyEventType.VisitReversed,
    )
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((e) => {
      const m = store.get(e.token);
      return {
        type: e.type,
        customerFullName: m?.customerFullName ?? "—",
        licensePlate: m?.licensePlate ?? "—",
        organizationName: m?.organization.name ?? "—",
        at: e.at,
      };
    });
}

// ---------------------------------------------------------------------------
// CSV export (§15 exports). Values are CSV-escaped.
// ---------------------------------------------------------------------------

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(","));
  return lines.join("\n");
}

/** CSV of all customers/memberships. */
export function customersCsv(): string {
  const rows = [...store.entries()].map(([token, m]) => [
    m.customerFullName,
    m.phoneNormalized ?? "",
    m.licensePlate,
    m.organization.name,
    m.status,
    m.paidVisitsInCycle,
    m.availableRewards,
    m.joinedAt,
    token,
  ]);
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
      "token",
    ],
    rows,
  );
}

/** CSV of the visit log. */
export function visitsCsv(): string {
  const rows = getVisitLog().map((v) => [
    v.at,
    v.type,
    v.customerFullName,
    v.licensePlate,
    v.organizationName,
  ]);
  return toCsv(["fecha", "tipo", "cliente", "placa", "organizacion"], rows);
}
