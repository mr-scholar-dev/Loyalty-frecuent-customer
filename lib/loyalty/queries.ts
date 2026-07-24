import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCardUrl,
  getProgressView,
  maskCustomerName,
  type CardView,
  type OrganizationBrand,
} from "@/lib/loyalty/card";
import { hashToken, issuePublicToken } from "@/lib/security/token";
import type { MembershipStatus } from "@/types/domain";

/**
 * Real (Supabase-backed) queries for the public customer loop.
 *
 * Public pages have no user session, so these run with the ADMIN (secret-key)
 * client which bypasses RLS. Access is instead constrained by the unguessable
 * token (card lookup) and by explicit org/program checks (enrollment). Never
 * import this into a Client Component.
 */

export interface OrgBrandBySlug extends OrganizationBrand {
  id: string;
  slug: string;
  paidVisitsRequired: number;
}

/** Look up an active organization + its active program by slug. */
export async function getOrgBySlug(
  slug: string,
): Promise<OrgBrandBySlug | null> {
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, slug, name, logo_url, primary_color, secondary_color")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!org) return null;

  const { data: program } = await admin
    .from("loyalty_programs")
    .select("paid_visits_required")
    .eq("organization_id", org.id)
    .eq("status", "active")
    .maybeSingle();

  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    logoUrl: org.logo_url,
    primaryColor: org.primary_color,
    secondaryColor: org.secondary_color,
    paidVisitsRequired: program?.paid_visits_required ?? 9,
  };
}

export interface EnrollInput {
  slug: string;
  fullName: string;
  phoneRaw: string;
  phoneNormalized: string;
  plateRaw: string;
  plateNormalized: string;
  email: string | null;
  marketingConsent: boolean;
}

export type EnrollResult =
  | { ok: true; token: string }
  | {
      ok: false;
      reason: "org_not_found" | "no_program" | "duplicate_plate" | "error";
    };

/**
 * Create a customer + vehicle + membership (with a hashed public token) and its
 * balance projection. Detects a duplicate plate per organization (§10 Flujo B).
 */
export async function enrollCustomer(
  input: EnrollInput,
): Promise<EnrollResult> {
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", input.slug)
    .eq("status", "active")
    .maybeSingle();
  if (!org) return { ok: false, reason: "org_not_found" };

  const { data: program } = await admin
    .from("loyalty_programs")
    .select("id")
    .eq("organization_id", org.id)
    .eq("status", "active")
    .maybeSingle();
  if (!program) return { ok: false, reason: "no_program" };

  // Duplicate plate within the org → do not create silently.
  const { data: dupe } = await admin
    .from("vehicles")
    .select("id")
    .eq("organization_id", org.id)
    .eq("license_plate_normalized", input.plateNormalized)
    .maybeSingle();
  if (dupe) return { ok: false, reason: "duplicate_plate" };

  // Reuse an existing customer with the same phone, else create one.
  let customerId: string;
  const { data: existingCustomer } = await admin
    .from("customers")
    .select("id")
    .eq("organization_id", org.id)
    .eq("phone_normalized", input.phoneNormalized)
    .maybeSingle();
  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: customer, error } = await admin
      .from("customers")
      .insert({
        organization_id: org.id,
        full_name: input.fullName,
        phone_raw: input.phoneRaw,
        phone_normalized: input.phoneNormalized,
        email: input.email,
        marketing_consent: input.marketingConsent,
        privacy_consent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !customer) return { ok: false, reason: "error" };
    customerId = customer.id;
  }

  const { data: vehicle, error: vErr } = await admin
    .from("vehicles")
    .insert({
      organization_id: org.id,
      customer_id: customerId,
      license_plate_raw: input.plateRaw,
      license_plate_normalized: input.plateNormalized,
    })
    .select("id")
    .single();
  if (vErr || !vehicle) return { ok: false, reason: "error" };

  const issued = issuePublicToken();
  const { data: membership, error: mErr } = await admin
    .from("memberships")
    .insert({
      organization_id: org.id,
      customer_id: customerId,
      vehicle_id: vehicle.id,
      loyalty_program_id: program.id,
      public_token_hash: issued.hash,
      public_token_prefix: issued.prefix,
      status: "active",
    })
    .select("id")
    .single();
  if (mErr || !membership) return { ok: false, reason: "error" };

  const { error: bErr } = await admin.from("membership_balances").insert({
    membership_id: membership.id,
    organization_id: org.id,
  });
  if (bErr) return { ok: false, reason: "error" };

  return { ok: true, token: issued.token };
}

/** Build the safe public card view for a token, from the DB, or null. */
export async function getCardViewByToken(
  token: string,
): Promise<CardView | null> {
  const admin = createAdminClient();
  const { data: m } = await admin
    .from("memberships")
    .select(
      "id, status, last_activity_at, organization_id, customer_id, vehicle_id, loyalty_program_id",
    )
    .eq("public_token_hash", hashToken(token))
    .maybeSingle();
  if (!m) return null;

  const [
    { data: org },
    { data: customer },
    { data: vehicle },
    { data: balance },
    { data: program },
  ] = await Promise.all([
    admin
      .from("organizations")
      .select("name, logo_url, primary_color, secondary_color")
      .eq("id", m.organization_id)
      .maybeSingle(),
    admin
      .from("customers")
      .select("full_name")
      .eq("id", m.customer_id)
      .maybeSingle(),
    admin
      .from("vehicles")
      .select("license_plate_normalized")
      .eq("id", m.vehicle_id)
      .maybeSingle(),
    admin
      .from("membership_balances")
      .select("paid_visits_in_cycle, available_rewards")
      .eq("membership_id", m.id)
      .maybeSingle(),
    admin
      .from("loyalty_programs")
      .select("paid_visits_required, reward_quantity")
      .eq("id", m.loyalty_program_id)
      .maybeSingle(),
  ]);

  if (!org || !customer || !vehicle) return null;

  return {
    organization: {
      name: org.name,
      logoUrl: org.logo_url,
      primaryColor: org.primary_color,
      secondaryColor: org.secondary_color,
    },
    customerDisplayName: maskCustomerName(customer.full_name),
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
    cardUrl: buildCardUrl(token),
    lastActivityAt: m.last_activity_at,
  };
}
