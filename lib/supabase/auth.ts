import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Current authenticated user, or null. Memoized per-request with `cache()` so
 * getUser() runs at most ONCE per request. Repeated calls (e.g. across the
 * layout, page and multiple server-action tool steps) reuse the first result;
 * this avoids a late getUser() re-validating the token mid-action, which — with
 * the project's ES256 signing keys — could fail and make supabase-js clear the
 * session (logging the user out).
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Platform-wide superadmin allowlist (comma-separated emails in
 * SUPERADMIN_EMAILS). Superadmins bypass the payment gate and can manage every
 * organization. This is an app-layer convenience; RLS remains the real boundary.
 */
function superadminEmails(): Set<string> {
  return new Set(
    (process.env.SUPERADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Whether the current user is a platform superadmin. */
export const isSuperadmin = cache(async function isSuperadmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.email) return false;
  return superadminEmails().has(user.email.toLowerCase());
});

export interface ActiveMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: string;
  /** Organization subscription status: 'trial' | 'active' | 'suspended'. */
  status: string;
}

/**
 * The current user's active organization membership (org + role + status), read
 * under RLS. Returns null if not authenticated or not a member of any org.
 */
export const getActiveMembership = cache(async function getActiveMembership(): Promise<ActiveMembership | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
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
    .select("name, slug, status")
    .eq("id", membership.organization_id)
    .maybeSingle();

  return {
    organizationId: membership.organization_id,
    organizationName: org?.name ?? "",
    organizationSlug: org?.slug ?? "",
    role: membership.role,
    status: org?.status ?? "trial",
  };
});

/**
 * Whether the current user may fully use the app: a superadmin, or the owner/
 * member of an organization whose subscription is active (paid). Used both to
 * gate the dashboard shell and to reject writes from unpaid organizations.
 */
export const hasPaidAccess = cache(async function hasPaidAccess(): Promise<boolean> {
  if (await isSuperadmin()) return true;
  const membership = await getActiveMembership();
  return membership?.status === "active";
});
