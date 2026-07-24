/**
 * In-memory demo store for enrollments, while the database layer is deferred.
 *
 * TEMPORARY / DEV-ONLY: state lives in the Node process and is lost on restart;
 * it does NOT work across serverless instances. It exists so the enrollment ->
 * success -> card flow is fully demoable without Supabase. Replace with real,
 * transactional, RLS-protected persistence in the database phase.
 */

import { MembershipStatus } from "@/types/domain";
import {
  buildCardUrl,
  getProgressView,
  maskCustomerName,
  type CardView,
  type OrganizationBrand,
} from "@/lib/loyalty/card";
import { getSampleCardView } from "@/lib/loyalty/sample";
import { generatePublicToken } from "@/lib/security/token";

interface DemoMembership {
  organization: OrganizationBrand;
  customerFullName: string;
  licensePlate: string;
  paidVisitsInCycle: number;
  availableRewards: number;
  status: MembershipStatus;
  joinedAt: string;
}

/**
 * Anchored on `globalThis` so the same Map is shared across the separately
 * bundled server-action and RSC module instances in Next dev (the standard
 * dev-singleton pattern). Still process-local — see the file header caveat.
 */
const globalForStore = globalThis as typeof globalThis & {
  __loyaltyDemoStore?: Map<string, DemoMembership>;
};

const store: Map<string, DemoMembership> =
  globalForStore.__loyaltyDemoStore ??
  (globalForStore.__loyaltyDemoStore = new Map<string, DemoMembership>());

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
  });
  return token;
}

function toCardView(token: string, m: DemoMembership): CardView {
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
    lastActivityAt: m.joinedAt,
  };
}

/**
 * Resolve a card view by token: freshly-created demo memberships first, then
 * the static demo samples. Returns null when unknown.
 */
export function resolveCardView(token: string): CardView | null {
  const created = store.get(token);
  if (created) return toCardView(token, created);
  return getSampleCardView(token);
}
