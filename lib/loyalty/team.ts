import "server-only";
import { getActiveMembership, getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Team reads. RLS blocks reading other users' profiles/emails, so the team list
 * is built with the ADMIN client — after confirming the caller belongs to the
 * org. Only the owner sees management controls (checked in the page/actions).
 */

export interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  role: "owner" | "manager" | "employee";
  status: "invited" | "active" | "disabled";
  isSelf: boolean;
}

export interface TeamView {
  members: TeamMember[];
  isOwner: boolean;
}

export async function listTeam(): Promise<TeamView | null> {
  const [membership, user] = await Promise.all([
    getActiveMembership(),
    getCurrentUser(),
  ]);
  if (!membership || !user) return null;

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("organization_members")
    .select("user_id, role, status, created_at")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: true });

  const ids = (rows ?? []).map((r) => r.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? ""]),
  );

  // Emails live in auth.users — reachable only via the auth admin API.
  const emailById = new Map<string, string>();
  const { data: usersList } = await admin.auth.admin.listUsers();
  for (const u of usersList?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email);
  }

  const members: TeamMember[] = (rows ?? []).map((r) => ({
    userId: r.user_id,
    fullName: nameById.get(r.user_id) || "—",
    email: emailById.get(r.user_id) || "—",
    role: r.role,
    status: r.status,
    isSelf: r.user_id === user.id,
  }));

  return { members, isOwner: membership.role === "owner" };
}
