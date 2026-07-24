-- ============================================================================
-- pgTAP · RPC transaccionales (Fase 3). Ejecutar con: supabase test db
--
-- Corre como superusuario; cambiamos a `role authenticated` con un claim JWT
-- para que la autorización interna de los RPC (has_org_role) aplique.
-- ============================================================================
begin;
select plan(5);

-- --- Datos base (superusuario) ----------------------------------------------
insert into auth.users (id, aud, role, email) values
  ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'owner-rpc@example.com');
insert into public.profiles (id, full_name) values
  ('44444444-4444-4444-8444-444444444444', 'Owner RPC');
insert into public.organizations (id, name, slug, status) values
  ('a1a1a1a1-0000-4000-8000-000000000000', 'Org RPC', 'org-rpc', 'active');
insert into public.organization_members (organization_id, user_id, role, status) values
  ('a1a1a1a1-0000-4000-8000-000000000000', '44444444-4444-4444-8444-444444444444', 'owner', 'active');
insert into public.loyalty_programs (id, organization_id, name, paid_visits_required, reward_quantity, status) values
  ('c1c1c1c1-0000-4000-8000-000000000000', 'a1a1a1a1-0000-4000-8000-000000000000', 'Prog', 9, 1, 'active');
insert into public.customers (id, organization_id, full_name, phone_raw, phone_normalized) values
  ('d1d1d1d1-0000-4000-8000-000000000000', 'a1a1a1a1-0000-4000-8000-000000000000', 'Cliente RPC', '8', '+50600000001');
insert into public.vehicles (id, organization_id, customer_id, license_plate_raw, license_plate_normalized) values
  ('e1e1e1e1-0000-4000-8000-000000000000', 'a1a1a1a1-0000-4000-8000-000000000000',
   'd1d1d1d1-0000-4000-8000-000000000000', 'RPC-1', 'RPC1');
insert into public.memberships
  (id, organization_id, customer_id, vehicle_id, loyalty_program_id, public_token_hash, public_token_prefix, status)
values
  ('f1f1f1f1-0000-4000-8000-000000000000', 'a1a1a1a1-0000-4000-8000-000000000000',
   'd1d1d1d1-0000-4000-8000-000000000000', 'e1e1e1e1-0000-4000-8000-000000000000',
   'c1c1c1c1-0000-4000-8000-000000000000', 'rpc-token-hash', 'rpc', 'active');

-- --- Impersonar owner -------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
set local role authenticated;

-- 9 lavados pagados => recompensa + ciclo reiniciado.
do $$
begin
  for i in 1..9 loop
    perform public.register_paid_visit(
      'f1f1f1f1-0000-4000-8000-000000000000'::uuid, null, 'k' || i);
  end loop;
end
$$;

select is(
  (select available_rewards from public.membership_balances
     where membership_id = 'f1f1f1f1-0000-4000-8000-000000000000'),
  1, 'La novena visita genera una recompensa');
select is(
  (select paid_visits_in_cycle from public.membership_balances
     where membership_id = 'f1f1f1f1-0000-4000-8000-000000000000'),
  0, 'El ciclo se reinicia tras la recompensa');

-- Idempotencia + canje.
do $$
begin
  perform public.register_paid_visit('f1f1f1f1-0000-4000-8000-000000000000'::uuid, null, 'dup');
  perform public.register_paid_visit('f1f1f1f1-0000-4000-8000-000000000000'::uuid, null, 'dup');
  perform public.redeem_reward('f1f1f1f1-0000-4000-8000-000000000000'::uuid, null, 'r1');
end
$$;

select is(
  (select paid_visits_in_cycle from public.membership_balances
     where membership_id = 'f1f1f1f1-0000-4000-8000-000000000000'),
  1, 'Idempotencia: la clave repetida no cuenta dos veces');
select is(
  (select available_rewards from public.membership_balances
     where membership_id = 'f1f1f1f1-0000-4000-8000-000000000000'),
  0, 'El canje reduce las recompensas disponibles');

-- La reversión exige motivo.
select throws_ok(
  $$ select public.reverse_last_visit('f1f1f1f1-0000-4000-8000-000000000000'::uuid, '') $$,
  'La reversión sin motivo falla');

reset role;
select * from finish();
rollback;
