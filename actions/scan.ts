"use server";

import { createClient } from "@/lib/supabase/server";
import { hasPaidAccess } from "@/lib/supabase/auth";
import {
  getStaffMembershipById,
  getStaffMembershipByToken,
} from "@/lib/loyalty/staff";
import type {
  MutationResult,
  StaffMembershipView,
} from "@/lib/loyalty/scan-types";

/**
 * Staff scan actions (§10 Flujo D/E/F). Backed by Supabase:
 *   - lookup reads under the employee's session (RLS → own org only)
 *   - mutations call the transactional RPCs (register_paid_visit /
 *     redeem_reward), which authorize the employee and update the ledger +
 *     balance atomically. Idempotency key comes from the client (§12).
 */

/** Look up a membership by scanned value (card URL or raw token). */
export async function lookupMembership(
  scannedValue: string,
): Promise<StaffMembershipView | null> {
  return getStaffMembershipByToken(scannedValue);
}

function mapRpcError(
  message: string,
): Extract<MutationResult, { ok: false }>["reason"] {
  if (/not_active|blocked/.test(message)) return "blocked";
  if (/no_reward/.test(message)) return "no_reward";
  if (/not_found/.test(message)) return "not_found";
  if (/not_authorized|permission|denied/i.test(message))
    return "not_authorized";
  return "error";
}

async function callRpc(
  fn: "register_paid_visit" | "redeem_reward",
  membershipId: string,
  idempotencyKey: string,
): Promise<MutationResult> {
  // Payment gate: unpaid organizations can't register visits or redeem rewards.
  if (!(await hasPaidAccess())) return { ok: false, reason: "not_authorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, {
    p_membership_id: membershipId,
    p_idempotency_key: idempotencyKey,
  });
  if (error) {
    return { ok: false, reason: mapRpcError(error.message) };
  }
  const view = await getStaffMembershipById(membershipId);
  if (!view) return { ok: false, reason: "error" };
  const rewardEarned =
    typeof data === "object" && data !== null && "reward_earned" in data
      ? Boolean((data as { reward_earned?: unknown }).reward_earned)
      : false;
  return { ok: true, view, rewardEarned };
}

/** Register a paid visit via the transactional RPC. */
export async function registerVisitAction(
  membershipId: string,
  idempotencyKey: string,
): Promise<MutationResult> {
  return callRpc("register_paid_visit", membershipId, idempotencyKey);
}

/** Redeem one available reward via the transactional RPC. */
export async function redeemRewardAction(
  membershipId: string,
  idempotencyKey: string,
): Promise<MutationResult> {
  return callRpc("redeem_reward", membershipId, idempotencyKey);
}
