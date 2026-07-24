-- ============================================================================
-- Seed de desarrollo (Fase 1).
--
-- Crea una organización con su sucursal, un programa ACTIVO y datos de cliente
-- de ejemplo. NO crea usuarios de auth ni miembros: los usuarios se crean con
-- la Supabase CLI / Studio y luego se vinculan (ver bloque comentado al final).
-- Ejecutado por `supabase db reset`.
-- ============================================================================

-- Organización ---------------------------------------------------------------
insert into public.organizations (id, name, slug, status, primary_color, secondary_color)
values
  ('a0000000-0000-4000-8000-000000000001', 'Auto Lavado El Sol', 'el-sol', 'active', '#0f766e', '#0ea5e9')
on conflict (id) do nothing;

-- Sucursal principal ---------------------------------------------------------
insert into public.branches (id, organization_id, name, code, status)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Sucursal Central', 'CENTRAL', 'active')
on conflict (id) do nothing;

-- Programa por defecto (9 pagados -> 1 gratis) -------------------------------
insert into public.loyalty_programs
  (id, organization_id, name, program_type, paid_visits_required, reward_quantity, reward_name, cycle_behavior, status)
values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Programa de lavados', 'visit_count', 9, 1, 'Lavado gratis', 'rolling_cycle', 'active')
on conflict (id) do nothing;

-- Cliente + vehículo + membresía de ejemplo ----------------------------------
insert into public.customers
  (id, organization_id, full_name, phone_raw, phone_normalized, privacy_consent_at)
values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'María Rodríguez Solano', '8888-7777', '+50688887777', now())
on conflict (id) do nothing;

insert into public.vehicles
  (id, organization_id, customer_id, license_plate_raw, license_plate_normalized)
values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', 'BMT-345', 'BMT345')
on conflict (id) do nothing;

insert into public.memberships
  (id, organization_id, customer_id, vehicle_id, loyalty_program_id,
   public_token_hash, public_token_prefix, status)
values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001',
   'c0000000-0000-4000-8000-000000000001',
   'seed-token-hash-0001', 'seedtok1', 'active')
on conflict (id) do nothing;

-- Balance inicial (proyección) -----------------------------------------------
insert into public.membership_balances (membership_id, organization_id, paid_visits_in_cycle, available_rewards)
values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 3, 0)
on conflict (membership_id) do nothing;

-- ----------------------------------------------------------------------------
-- Owner de la organización (hacerlo tras crear el usuario en Auth):
--
--   1) Crea el usuario en Studio (Authentication) o con la CLI y copia su UUID.
--   2) insert into public.profiles (id, full_name) values ('<uuid>', 'Owner');
--   3) insert into public.organization_members (organization_id, user_id, role, status)
--        values ('a0000000-0000-4000-8000-000000000001', '<uuid>', 'owner', 'active');
-- ----------------------------------------------------------------------------
