"use server";

import {
  getStaffView,
  parseScannedToken,
  registerVisit,
  redeemReward,
  type MutationResult,
  type StaffMembershipView,
} from "@/lib/loyalty/demo-store";

/**
 * Staff scan actions (§10 Flujo D/E/F). Demo-backed for now; these become
 * RLS-protected calls to the `register_paid_visit` / `redeem_reward` RPCs in the
 * database phase. Server time is used for issuance (§12), never the device.
 *
 * NOTE: authentication/authorization is NOT enforced yet (auth is deferred).
 * The real implementation must verify the employee's session, org membership
 * and permissions before mutating.
 */

/** Look up a membership by scanned value (card URL or raw token). */
export async function lookupMembership(
  scannedValue: string,
): Promise<StaffMembershipView | null> {
  const token = parseScannedToken(scannedValue);
  if (!token) return null;
  return getStaffView(token);
}

/** Register a paid visit. Idempotency key comes from the client (§12). */
export async function registerVisitAction(
  token: string,
  idempotencyKey: string,
): Promise<MutationResult> {
  return registerVisit(token, idempotencyKey, new Date().toISOString());
}

/** Redeem one available reward. Idempotency key comes from the client (§12). */
export async function redeemRewardAction(
  token: string,
  idempotencyKey: string,
): Promise<MutationResult> {
  return redeemReward(token, idempotencyKey, new Date().toISOString());
}
