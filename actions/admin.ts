"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  blockMembership,
  reactivateMembership,
  reissueCard,
  reverseLastVisit,
  type AdminResult,
} from "@/lib/loyalty/demo-store";

/**
 * Admin membership actions (§7 Fase 7, §Flujo G). Demo-backed for now; these
 * become RLS-protected, audited mutations in the database phase.
 *
 * NOTE: authorization is NOT enforced yet. The real implementation must require
 * the appropriate role (owner/manager) and record the acting user.
 */

function now(): string {
  return new Date().toISOString();
}

function revalidate(token: string): void {
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${token}`);
  revalidatePath("/dashboard/audit");
}

export async function blockAction(token: string): Promise<AdminResult> {
  const result = blockMembership(token, now());
  revalidate(token);
  return result;
}

export async function reactivateAction(token: string): Promise<AdminResult> {
  const result = reactivateMembership(token, now());
  revalidate(token);
  return result;
}

export async function reverseVisitAction(
  token: string,
  reason: string,
): Promise<AdminResult> {
  const result = reverseLastVisit(token, reason, now());
  revalidate(token);
  revalidatePath("/dashboard/visits");
  return result;
}

/** Reissue the card and navigate to the new membership detail. */
export async function reissueAction(token: string): Promise<{ error: string }> {
  const result = reissueCard(token, now());
  if (!result.ok) {
    return { error: "No se encontró la membresía." };
  }
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/audit");
  redirect(`/dashboard/customers/${result.newToken}`);
}
