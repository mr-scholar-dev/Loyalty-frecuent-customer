"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { issuePublicToken } from "@/lib/security/token";

/**
 * Admin membership actions (§7 Fase 7, §Flujo G), backed by Supabase.
 *
 * Status changes and reissue run under the employee's session (RLS enforces the
 * owner/manager write policy); the audit row is written with the admin client
 * (audit_logs has no client insert policy). Reversal uses the transactional
 * `reverse_last_visit` RPC. A future improvement is dedicated SECURITY DEFINER
 * RPCs for block/reactivate/reissue so the audit is part of the same tx.
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

async function writeAudit(
  organizationId: string,
  action: string,
  entityId: string,
  after: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    organization_id: organizationId,
    actor_user_id: user?.id ?? null,
    action,
    entity_type: "membership",
    entity_id: entityId,
    after_data: after,
  });
}

async function setStatus(
  membershipId: string,
  status: "blocked" | "active",
  action: string,
  note: string,
): Promise<AdminActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .update({ status })
    .eq("id", membershipId)
    .select("id, organization_id");
  if (error) return { ok: false, reason: "error" };
  const row = data?.[0];
  if (!row) return { ok: false, reason: "not_authorized" };
  await writeAudit(row.organization_id, action, membershipId, { note });
  revalidate(membershipId);
  return { ok: true };
}

export async function blockAction(
  membershipId: string,
): Promise<AdminActionResult> {
  return setStatus(
    membershipId,
    "blocked",
    "membership.block",
    "Tarjeta bloqueada",
  );
}

export async function reactivateAction(
  membershipId: string,
): Promise<AdminActionResult> {
  return setStatus(
    membershipId,
    "active",
    "membership.reactivate",
    "Tarjeta reactivada",
  );
}

/** Reissue the card: mint a new token, revoking the previous one. */
export async function reissueAction(
  membershipId: string,
): Promise<ReissueResult> {
  const issued = issuePublicToken();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .update({
      public_token_hash: issued.hash,
      public_token_prefix: issued.prefix,
    })
    .eq("id", membershipId)
    .select("id, organization_id");
  if (error) return { ok: false, reason: "error" };
  const row = data?.[0];
  if (!row) return { ok: false, reason: "not_authorized" };
  await writeAudit(row.organization_id, "membership.reissue", membershipId, {
    note: "Tarjeta reemitida (token anterior revocado)",
  });
  revalidate(membershipId);
  return { ok: true, newToken: issued.token };
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
