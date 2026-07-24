/**
 * Real RLS verification against the linked Supabase project (§17, Fase 1/8).
 *
 *   node scripts/verify-rls.mjs
 *
 * pgTAP needs Docker (unavailable here), so this proves the key security
 * invariants over the live DB using real user sessions:
 *   1. Organization A cannot read organization B's data (tenant isolation).
 *   2. An employee cannot modify the loyalty program (owner-only write).
 *   3. membership_balances is not writable by clients (only via RPC).
 *
 * Avoids the flaky auth-admin API: org B is created data-only (PostgREST), and
 * we sign in with EXISTING users (owner + the seeded employee). Reads
 * credentials from .env.local; SEED_EMPLOYEE_* can override the employee login.
 */
import { readFileSync } from "node:fs";
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

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = env.SUPABASE_SECRET_KEY;
const admin = createClient(URL, SECRET, { auth: { persistSession: false } });

const OWNER = { email: "owner@elsol.com", password: "Owner1234!" };
const EMPLOYEE = {
  email: process.env.SEED_EMPLOYEE_EMAIL ?? "carlos.empleado@elsol.com",
  password: process.env.SEED_EMPLOYEE_PASSWORD ?? "Temp-564b4d4e",
};

let pass = 0;
let fail = 0;
function check(name, ok) {
  console.log(`${ok ? "✓ PASS" : "✗ FAIL"}  ${name}`);
  ok ? pass++ : fail++;
}

async function signIn(email, password) {
  const c = createClient(URL, PUBLISHABLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return c;
}

// --- Setup (admin / PostgREST only — no auth-admin) -------------------------
const { data: orgA } = await admin
  .from("organizations")
  .select("id")
  .eq("slug", "el-sol")
  .single();
const { data: aProgram } = await admin
  .from("loyalty_programs")
  .select("id, name")
  .eq("organization_id", orgA.id)
  .eq("status", "active")
  .single();
const { data: aBalance } = await admin
  .from("membership_balances")
  .select("membership_id, paid_visits_in_cycle")
  .eq("organization_id", orgA.id)
  .limit(1)
  .single();

// Throwaway org B + a customer (data only).
const { data: existingB } = await admin
  .from("organizations")
  .select("id")
  .eq("slug", "rls-test-b")
  .maybeSingle();
const orgBId =
  existingB?.id ??
  (
    await admin
      .from("organizations")
      .insert({ name: "RLS Test B", slug: "rls-test-b", status: "active" })
      .select("id")
      .single()
  ).data.id;
const { data: bCustomer } = await admin
  .from("customers")
  .upsert(
    {
      organization_id: orgBId,
      full_name: "Cliente B",
      phone_raw: "0000",
      phone_normalized: "+50600000000",
    },
    { onConflict: "organization_id,phone_normalized" },
  )
  .select("id")
  .single();

console.log("\n--- RLS checks ---");

// 1. Tenant isolation (from A's session).
try {
  const clientA = await signIn(OWNER.email, OWNER.password);
  const { data: orgs } = await clientA.from("organizations").select("id");
  const ids = (orgs ?? []).map((o) => o.id);
  check(
    "Org A solo ve su propia organización (no la B)",
    ids.includes(orgA.id) && !ids.includes(orgBId),
  );
  const { data: bSeen } = await clientA
    .from("customers")
    .select("id")
    .eq("id", bCustomer.id);
  check("Org A no puede leer un cliente de Org B", (bSeen ?? []).length === 0);

  // 3. Balance not writable even by the owner.
  const { data: balW } = await clientA
    .from("membership_balances")
    .update({ paid_visits_in_cycle: 999 })
    .eq("membership_id", aBalance.membership_id)
    .select("membership_id");
  check("Balance NO editable directamente (ni por owner)", (balW ?? []).length === 0);
} catch (e) {
  check(`Sesión owner (${e.message})`, false);
}

// 2. Employee cannot modify the program.
try {
  const clientEmp = await signIn(EMPLOYEE.email, EMPLOYEE.password);
  const { data: progW } = await clientEmp
    .from("loyalty_programs")
    .update({ name: "HACKEADO" })
    .eq("id", aProgram.id)
    .select("id");
  check("Employee NO puede modificar el programa", (progW ?? []).length === 0);

  const { data: custs } = await clientEmp.from("customers").select("id");
  check("Employee sí ve clientes de su organización", (custs ?? []).length >= 1);
} catch (e) {
  check(`Sesión employee (${e.message}) — revisa credenciales`, false);
}

// Program name must be intact after the attempted hack.
const { data: progStill } = await admin
  .from("loyalty_programs")
  .select("name")
  .eq("id", aProgram.id)
  .single();
check("El programa quedó intacto", progStill.name === aProgram.name);

// --- Cleanup ----------------------------------------------------------------
await admin.from("organizations").delete().eq("id", orgBId); // cascades org B

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
