"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/supabase/auth";

/**
 * Organization configuration actions (§7 Fase 7): branding, program and
 * branches. All run under the user's session — RLS enforces the owner-only
 * write policies, and the org is derived from the session (never the client).
 */

export type OrgActionResult = { ok: true } | { ok: false; message: string };

const HEX = /^#[0-9a-fA-F]{6}$/;

export async function updateOrgSettings(input: {
  name: string;
  primaryColor: string;
  secondaryColor: string;
}): Promise<OrgActionResult> {
  const membership = await getActiveMembership();
  if (!membership) return { ok: false, message: "Sesión no válida." };
  if (!input.name.trim())
    return { ok: false, message: "El nombre es obligatorio." };
  if (!HEX.test(input.primaryColor) || !HEX.test(input.secondaryColor)) {
    return { ok: false, message: "Colores inválidos (usa formato #RRGGBB)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: input.name.trim(),
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
    })
    .eq("id", membership.organizationId)
    .select("id");
  if (error) return { ok: false, message: "No se pudo guardar." };
  if (!data?.length)
    return { ok: false, message: "Solo el propietario puede editar." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  revalidatePath(`/${membership.organizationSlug}`);
  return { ok: true };
}

export async function updateProgram(input: {
  name: string;
  paidVisitsRequired: number;
  rewardQuantity: number;
  rewardName: string;
}): Promise<OrgActionResult> {
  const membership = await getActiveMembership();
  if (!membership) return { ok: false, message: "Sesión no válida." };
  if (
    !Number.isInteger(input.paidVisitsRequired) ||
    input.paidVisitsRequired < 1
  ) {
    return { ok: false, message: "Las visitas requeridas deben ser ≥ 1." };
  }
  if (!Number.isInteger(input.rewardQuantity) || input.rewardQuantity < 1) {
    return { ok: false, message: "La cantidad de recompensa debe ser ≥ 1." };
  }

  const supabase = await createClient();
  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("id")
    .eq("organization_id", membership.organizationId)
    .eq("status", "active")
    .maybeSingle();
  if (!program) return { ok: false, message: "No hay programa activo." };

  const { data, error } = await supabase
    .from("loyalty_programs")
    .update({
      name: input.name.trim() || "Programa de lavados",
      paid_visits_required: input.paidVisitsRequired,
      reward_quantity: input.rewardQuantity,
      reward_name: input.rewardName.trim() || "Lavado gratis",
    })
    .eq("id", program.id)
    .select("id");
  if (error) return { ok: false, message: "No se pudo guardar." };
  if (!data?.length)
    return { ok: false, message: "Solo el propietario puede editar." };

  revalidatePath("/dashboard/program");
  revalidatePath(`/${membership.organizationSlug}`);
  return { ok: true };
}

export async function createBranch(input: {
  name: string;
  code: string;
}): Promise<OrgActionResult> {
  const membership = await getActiveMembership();
  if (!membership) return { ok: false, message: "Sesión no válida." };
  if (!input.name.trim() || !input.code.trim()) {
    return { ok: false, message: "Nombre y código son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("branches").insert({
    organization_id: membership.organizationId,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    status: "active",
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Ya existe una sucursal con ese código." };
    }
    return { ok: false, message: "No se pudo crear (¿permisos?)." };
  }

  revalidatePath("/dashboard/branches");
  return { ok: true };
}

export async function setBranchStatus(
  branchId: string,
  status: "active" | "inactive",
): Promise<OrgActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .update({ status })
    .eq("id", branchId)
    .select("id");
  if (error) return { ok: false, message: "No se pudo actualizar." };
  if (!data?.length)
    return { ok: false, message: "Solo el propietario puede editar." };
  revalidatePath("/dashboard/branches");
  return { ok: true };
}
