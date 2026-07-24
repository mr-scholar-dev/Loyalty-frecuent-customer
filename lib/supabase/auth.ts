import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Current authenticated user (revalidated), or null. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export interface ActiveMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: string;
}

/**
 * The current user's active organization membership (org + role), read under
 * RLS. Returns null if not authenticated or not a member of any org.
 */
export async function getActiveMembership(): Promise<ActiveMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("name, slug")
    .eq("id", membership.organization_id)
    .maybeSingle();

  return {
    organizationId: membership.organization_id,
    organizationName: org?.name ?? "",
    organizationSlug: org?.slug ?? "",
    role: membership.role,
  };
}
