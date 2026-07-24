"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { issuePublicToken } from "@/lib/security/token";

/**
 * Admin membership actions (§7 Fase 7, §Flujo G).
 *
 * All go through transactional SECURITY DEFINER RPCs that authorize the caller
 * (owner/manager) and write the audit row in the same transaction. Called under
 * the user's session so auth.uid() is the acting user.
 */

export type AdminActionResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid_state" | "reason_required" | "not_authorized" | "error";
    };

export type ReissueResult =
  | { ok: true; newToken: string }
  | { ok: false; reason: "not_authorized" | "error" };

function revalidate(id: string): void {
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  revalidatePath("/dashboard/audit");
  revalidatePath("/dashboard");
}

function mapReason(
  message: string,
): Extract<AdminActionResult, { ok: false }>["reason"] {
  if (/not_authorized|permission|denied/i.test(message))
    return "not_authorized";
  return "error";
}

async function setStatus(
  membershipId: string,
  status: "blocked" | "active",
): Promise<AdminActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_membership_status", {
    p_membership_id: membershipId,
    p_status: status,
  });
  if (error) return { ok: false, reason: mapReason(error.message) };
  revalidate(membershipId);
  return { ok: true };
}

export async function blockAction(
  membershipId: string,
): Promise<AdminActionResult> {
  return setStatus(membershipId, "blocked");
}

export async function reactivateAction(
  membershipId: string,
): Promise<AdminActionResult> {
  return setStatus(membershipId, "active");
}

/** Reissue the card: mint a new token, revoking the previous one. */
export async function reissueAction(
  membershipId: string,
): Promise<ReissueResult> {
  const issued = issuePublicToken();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reissue_membership", {
    p_membership_id: membershipId,
    p_new_hash: issued.hash,
    p_new_prefix: issued.prefix,
  });
  if (error) {
    return {
      ok: false,
      reason: /not_authorized|permission|denied/i.test(error.message)
        ? "not_authorized"
        : "error",
    };
  }
  revalidate(membershipId);
  return { ok: true, newToken: issued.token };
}

/** Archive (soft-delete) or restore a customer — preserves ledger + audit. */
async function setArchived(
  membershipId: string,
  archived: boolean,
): Promise<AdminActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_customer_archived", {
    p_membership_id: membershipId,
    p_archived: archived,
  });
  if (error) return { ok: false, reason: mapReason(error.message) };
  revalidate(membershipId);
  return { ok: true };
}

export async function archiveCustomerAction(
  membershipId: string,
): Promise<AdminActionResult> {
  return setArchived(membershipId, true);
}

export async function unarchiveCustomerAction(
  membershipId: string,
): Promise<AdminActionResult> {
  return setArchived(membershipId, false);
}

/** Reverse the last paid visit via the transactional RPC (§Flujo G). */
export async function reverseVisitAction(
  membershipId: string,
  reason: string,
): Promise<AdminActionResult> {
  if (!reason.trim()) return { ok: false, reason: "reason_required" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("reverse_last_visit", {
    p_membership_id: membershipId,
    p_reason: reason,
  });
  if (error) {
    const msg = error.message;
    if (/reason_required/.test(msg))
      return { ok: false, reason: "reason_required" };
    if (/no_visit_to_reverse|invalid/.test(msg))
      return { ok: false, reason: "invalid_state" };
    if (/not_authorized|permission|denied/i.test(msg))
      return { ok: false, reason: "not_authorized" };
    return { ok: false, reason: "error" };
  }
  revalidate(membershipId);
  revalidatePath("/dashboard/visits");
  return { ok: true };
}
