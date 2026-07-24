/**
 * Dev seed (run against the linked Supabase project).
 *
 *   node scripts/seed-dev.mjs
 *
 * Idempotent: creates the demo organization, a branch, an ACTIVE program and an
 * owner user (Supabase Auth) linked via profiles + organization_members.
 * Reads credentials from .env.local. Uses the secret key (bypasses RLS) — dev
 * only. Prints the owner login credentials at the end.
 */
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@elsol.com";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "Owner1234!";

const supa = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

function die(label, error) {
  if (error) {
    console.error(`✗ ${label}:`, error.message ?? error);
    process.exit(1);
  }
}

// --- Organization (by slug) -------------------------------------------------
let orgId;
{
  const { data: existing } = await supa
    .from("organizations")
    .select("id")
    .eq("slug", "el-sol")
    .maybeSingle();
  if (existing) {
    orgId = existing.id;
    console.log("• organización el-sol ya existe");
  } else {
    const { data, error } = await supa
      .from("organizations")
      .insert({
        name: "Auto Lavado El Sol",
        slug: "el-sol",
        status: "active",
        primary_color: "#0f766e",
        secondary_color: "#0ea5e9",
      })
      .select("id")
      .single();
    die("crear organización", error);
    orgId = data.id;
    console.log("✓ organización el-sol creada");
  }
}

// --- Branch -----------------------------------------------------------------
{
  const { data: b } = await supa
    .from("branches")
    .select("id")
    .eq("organization_id", orgId)
    .eq("code", "CENTRAL")
    .maybeSingle();
  if (!b) {
    const { error } = await supa.from("branches").insert({
      organization_id: orgId,
      name: "Sucursal Central",
      code: "CENTRAL",
      status: "active",
    });
    die("crear sucursal", error);
    console.log("✓ sucursal CENTRAL creada");
  } else {
    console.log("• sucursal CENTRAL ya existe");
  }
}

// --- Active program ---------------------------------------------------------
{
  const { data: p } = await supa
    .from("loyalty_programs")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .maybeSingle();
  if (!p) {
    const { error } = await supa.from("loyalty_programs").insert({
      organization_id: orgId,
      name: "Programa de lavados",
      program_type: "visit_count",
      paid_visits_required: 9,
      reward_quantity: 1,
      reward_name: "Lavado gratis",
      cycle_behavior: "rolling_cycle",
      status: "active",
    });
    die("crear programa", error);
    console.log("✓ programa activo creado");
  } else {
    console.log("• programa activo ya existe");
  }
}

// --- Owner auth user (resilient: the admin API can be flaky) -----------------
let ownerId = null;
try {
  const { data: created, error } = await supa.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Owner El Sol" },
  });
  if (error) throw error;
  ownerId = created.user.id;
  console.log("✓ usuario owner creado");
} catch {
  try {
    const { data: list } = await supa.auth.admin.listUsers();
    const found = list?.users?.find((u) => u.email === OWNER_EMAIL);
    if (found) {
      ownerId = found.id;
      console.log("• usuario owner ya existe");
    }
  } catch {
    /* admin API unavailable right now */
  }
  if (!ownerId) {
    console.warn(
      "⚠ no se pudo crear/encontrar el owner (API admin de auth). Continúo; reintenta luego.",
    );
  }
}

// --- Profile + membership (solo si tenemos el owner) ------------------------
if (ownerId) {
  const { error: profErr } = await supa
    .from("profiles")
    .upsert({ id: ownerId, full_name: "Owner El Sol" }, { onConflict: "id" });
  die("upsert profile", profErr);

  const { data: mem } = await supa
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", ownerId)
    .maybeSingle();
  if (!mem) {
    const { error } = await supa.from("organization_members").insert({
      organization_id: orgId,
      user_id: ownerId,
      role: "owner",
      status: "active",
    });
    die("crear membership", error);
    console.log("✓ owner vinculado a la organización");
  } else {
    console.log("• owner ya vinculado");
  }
}

// --- Demo membership with the literal token "demo" -------------------------
// Lets the landing's "Ver tarjeta demo" link (/c/demo) resolve against the DB.
{
  const secret = env.TOKEN_HASH_SECRET;
  const demoHash = createHmac("sha256", secret).update("demo").digest("hex");
  const { data: existing } = await supa
    .from("memberships")
    .select("id")
    .eq("public_token_hash", demoHash)
    .maybeSingle();
  if (existing) {
    console.log("• membresía demo (token 'demo') ya existe");
  } else {
    const { data: prog } = await supa
      .from("loyalty_programs")
      .select("id")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .maybeSingle();

    const { data: cust, error: cErr } = await supa
      .from("customers")
      .insert({
        organization_id: orgId,
        full_name: "María Rodríguez Solano",
        phone_raw: "8888-7777",
        phone_normalized: "+50688887777",
        privacy_consent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    die("crear cliente demo", cErr);

    const { data: veh, error: vErr } = await supa
      .from("vehicles")
      .insert({
        organization_id: orgId,
        customer_id: cust.id,
        license_plate_raw: "BMT-345",
        license_plate_normalized: "BMT345",
      })
      .select("id")
      .single();
    die("crear vehículo demo", vErr);

    const { data: mem, error: mErr } = await supa
      .from("memberships")
      .insert({
        organization_id: orgId,
        customer_id: cust.id,
        vehicle_id: veh.id,
        loyalty_program_id: prog.id,
        public_token_hash: demoHash,
        public_token_prefix: "demo",
        status: "active",
      })
      .select("id")
      .single();
    die("crear membresía demo", mErr);

    const { error: bErr } = await supa.from("membership_balances").insert({
      membership_id: mem.id,
      organization_id: orgId,
      paid_visits_in_cycle: 3,
      available_rewards: 0,
    });
    die("crear balance demo", bErr);
    console.log("✓ membresía demo creada (token 'demo', 3/9)");
  }
}

console.log("\n=== Credenciales de acceso (dev) ===");
console.log(`  email:    ${OWNER_EMAIL}`);
console.log(`  password: ${OWNER_PASSWORD}`);
console.log("  tarjeta demo: /c/demo");
