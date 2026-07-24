import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getProgressView } from "@/lib/loyalty/progress";
import { hashToken } from "@/lib/security/token";
import type { MembershipStatus } from "@/types/domain";
import type { StaffMembershipView } from "@/lib/loyalty/scan-types";

/**
 * Staff-facing membership lookups, read with the EMPLOYEE'S session (RLS).
 * A staff member can therefore only resolve cards belonging to their own
 * organization (§Flujo D) — the token alone is not enough across tenants.
 */

/** Extract a token from a scanned value (a card URL or a raw token). */
function parseScannedToken(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/\/c\/([^/?#\s]+)/);
  return match?.[1] ?? trimmed;
}

interface MembershipRow {
  id: string;
  status: string;
  last_activity_at: string | null;
  organization_id: string;
  customer_id: string;
  vehicle_id: string;
  loyalty_program_id: string;
}

async function buildStaffView(
  supabase: Awaited<ReturnType<typeof createClient>>,
  m: MembershipRow,
): Promise<StaffMembershipView | null> {
  const [
    { data: org },
    { data: customer },
    { data: vehicle },
    { data: balance },
    { data: program },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("name")
      .eq("id", m.organization_id)
      .maybeSingle(),
    supabase
      .from("customers")
      .select("full_name")
      .eq("id", m.customer_id)
      .maybeSingle(),
    supabase
      .from("vehicles")
      .select("license_plate_normalized")
      .eq("id", m.vehicle_id)
      .maybeSingle(),
    supabase
      .from("membership_balances")
      .select("paid_visits_in_cycle, available_rewards")
      .eq("membership_id", m.id)
      .maybeSingle(),
    supabase
      .from("loyalty_programs")
      .select("paid_visits_required, reward_quantity")
      .eq("id", m.loyalty_program_id)
      .maybeSingle(),
  ]);

  if (!org || !customer || !vehicle) return null;

  return {
    membershipId: m.id,
    organizationName: org.name,
    customerFullName: customer.full_name,
    licensePlate: vehicle.license_plate_normalized,
    status: m.status as MembershipStatus,
    progress: getProgressView(
      {
        paidVisitsInCycle: balance?.paid_visits_in_cycle ?? 0,
        availableRewards: balance?.available_rewards ?? 0,
      },
      {
        paidVisitsRequired: program?.paid_visits_required ?? 9,
        rewardQuantity: program?.reward_quantity ?? 1,
      },
    ),
    lastActivityAt: m.last_activity_at,
  };
}

const MEMBERSHIP_COLUMNS =
  "id, status, last_activity_at, organization_id, customer_id, vehicle_id, loyalty_program_id";

/** Look up a membership by scanned token (card URL or raw token), under RLS. */
export async function getStaffMembershipByToken(
  scannedValue: string,
): Promise<StaffMembershipView | null> {
  const token = parseScannedToken(scannedValue);
  if (!token) return null;
  const supabase = await createClient();
  const { data: m } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_COLUMNS)
    .eq("public_token_hash", hashToken(token))
    .maybeSingle();
  if (!m) return null;
  return buildStaffView(supabase, m as MembershipRow);
}

/** Re-read a membership by id (after a mutation), under RLS. */
export async function getStaffMembershipById(
  membershipId: string,
): Promise<StaffMembershipView | null> {
  const supabase = await createClient();
  const { data: m } = await supabase
    .from("memberships")
    .select(MEMBERSHIP_COLUMNS)
    .eq("id", membershipId)
    .maybeSingle();
  if (!m) return null;
  return buildStaffView(supabase, m as MembershipRow);
}
