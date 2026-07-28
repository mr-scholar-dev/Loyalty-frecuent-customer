"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperadmin } from "@/lib/supabase/auth";

/**
 * Superadmin-only organization management. Gated by the SUPERADMIN_EMAILS
 * allowlist and executed with the admin client (bypasses RLS) so the platform
 * owner can see and activate every organization — the manual "el pago cayó"
 * switch until Stripe billing is live.
 */

export interface OrgRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
}

export async function listOrganizations(): Promise<OrgRow[]> {
  if (!(await isSuperadmin())) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, name, slug, status, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    status: o.status,
    createdAt: o.created_at,
  }));
}

export type SuperadminResult = { ok: true } | { ok: false; message: string };

const ALLOWED = new Set(["active", "suspended", "trial"]);

export async function setOrganizationStatus(
  organizationId: string,
  status: string,
): Promise<SuperadminResult> {
  if (!(await isSuperadmin())) {
    return { ok: false, message: "No autorizado." };
  }
  if (!ALLOWED.has(status)) {
    return { ok: false, message: "Estado inválido." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ status })
    .eq("id", organizationId);
  if (error) return { ok: false, message: "No se pudo actualizar." };

  revalidatePath("/dashboard/admin");
  return { ok: true };
}
