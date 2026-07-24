"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveMembership, getCurrentUser } from "@/lib/supabase/auth";

/**
 * Team management (§6, §7). Only the owner can invite/manage members.
 *
 * Invites use the admin client (creating an auth user + profile requires it and
 * bypasses RLS) after an explicit owner check. Role/status changes run under the
 * user's session so RLS enforces the owner-only write policy too.
 */

type InviteRole = "manager" | "employee";

export type InviteResult =
  | { ok: true; existed: boolean; tempPassword: string | null }
  | { ok: false; message: string };

export type TeamActionResult = { ok: true } | { ok: false; message: string };

async function requireOwnerOrgId(): Promise<string | null> {
  const membership = await getActiveMembership();
  if (!membership || membership.role !== "owner") return null;
  return membership.organizationId;
}

export async function inviteMember(input: {
  email: string;
  fullName: string;
  role: InviteRole;
}): Promise<InviteResult> {
  const orgId = await requireOwnerOrgId();
  if (!orgId)
    return { ok: false, message: "Solo el propietario puede invitar." };

  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: "Correo inválido." };
  }
  if (input.role !== "manager" && input.role !== "employee") {
    return { ok: false, message: "Rol inválido." };
  }

  const admin = createAdminClient();

  // Find an existing auth user with this email, else create one.
  let userId: string | null = null;
  let tempPassword: string | null = null;
  let existed = false;

  const { data: usersList } = await admin.auth.admin.listUsers();
  const found = usersList?.users?.find((u) => u.email === email);
  if (found) {
    userId = found.id;
    existed = true;
  } else {
    tempPassword = `Temp-${randomBytes(4).toString("hex")}`;
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: input.fullName.trim() },
    });
    if (error || !created?.user) {
      return { ok: false, message: "No se pudo crear el usuario. Reintenta." };
    }
    userId = created.user.id;
  }

  await admin
    .from("profiles")
    .upsert(
      { id: userId, full_name: input.fullName.trim() },
      { onConflict: "id" },
    );

  const { data: existingMem } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingMem) {
    return {
      ok: false,
      message: "Esa persona ya es miembro de la organización.",
    };
  }

  const { error: memErr } = await admin.from("organization_members").insert({
    organization_id: orgId,
    user_id: userId,
    role: input.role,
    status: "active",
  });
  if (memErr) return { ok: false, message: "No se pudo agregar al equipo." };

  await admin.from("audit_logs").insert({
    organization_id: orgId,
    action: "member.invite",
    entity_type: "member",
    entity_id: userId,
    after_data: { email, role: input.role },
  });

  revalidatePath("/dashboard/team");
  return { ok: true, existed, tempPassword };
}

async function updateMember(
  userId: string,
  patch: { role?: string; status?: string },
): Promise<TeamActionResult> {
  const membership = await getActiveMembership();
  if (!membership || membership.role !== "owner") {
    return {
      ok: false,
      message: "Solo el propietario puede editar el equipo.",
    };
  }
  const me = await getCurrentUser();
  if (me?.id === userId) {
    return { ok: false, message: "No puedes cambiar tu propio acceso." };
  }

  // Runs under the user session → RLS also enforces the owner-only policy.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .update(patch)
    .eq("organization_id", membership.organizationId)
    .eq("user_id", userId)
    .select("id");
  if (error) return { ok: false, message: "No se pudo actualizar." };
  if (!data?.length) return { ok: false, message: "Sin permiso." };

  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function setMemberRole(
  userId: string,
  role: InviteRole,
): Promise<TeamActionResult> {
  if (role !== "manager" && role !== "employee") {
    return { ok: false, message: "Rol inválido." };
  }
  return updateMember(userId, { role });
}

export async function setMemberStatus(
  userId: string,
  status: "active" | "disabled",
): Promise<TeamActionResult> {
  return updateMember(userId, { status });
}
