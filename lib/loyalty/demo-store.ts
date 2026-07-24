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

import { MembershipStatus } from "@/types/domain";
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
const globalForStore = globalThis as typeof globalThis & {
  __loyaltyDemoStore?: Map<string, MembershipRecord>;
  __loyaltyIdempotencyKeys?: Set<string>;
};

function seedStore(): Map<string, MembershipRecord> {
  const map = new Map<string, MembershipRecord>();
  for (const [token, seed] of Object.entries(SAMPLE_SEEDS)) {
    map.set(token, { ...seed, organization: { ...seed.organization } });
  }
  return map;
}

const store: Map<string, MembershipRecord> =
  globalForStore.__loyaltyDemoStore ??
  (globalForStore.__loyaltyDemoStore = seedStore());

/** Idempotency keys already processed (§12) — prevents double-processing. */
const processedKeys: Set<string> =
  globalForStore.__loyaltyIdempotencyKeys ??
  (globalForStore.__loyaltyIdempotencyKeys = new Set<string>());

export interface CreateMembershipInput {
  organization: OrganizationBrand;
  customerFullName: string;
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

  return { ok: true, view: toStaffView(token, record) };
}
