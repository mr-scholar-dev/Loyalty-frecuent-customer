-- ============================================================================
-- pgTAP · Aislamiento multiempresa por RLS (criterios de aceptación, Fase 1)
--
-- Ejecutar con: supabase test db (corre como superusuario, que SALTA RLS; por
-- eso cambiamos a `role authenticated` con un claim JWT para probar la política).
--
-- Nota: el INSERT en auth.users usa columnas mínimas; ajústalo si tu versión de
-- Supabase exige otras.
-- ============================================================================
begin;
select plan(4);

-- --- Datos base (como superusuario, saltando RLS) ---------------------------
insert into auth.users (id, aud, role, email) values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner-a@example.com'),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'owner-b@example.com'),
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'employee-a@example.com');

insert into public.profiles (id, full_name) values
  ('11111111-1111-4111-8111-111111111111', 'Owner A'),
  ('22222222-2222-4222-8222-222222222222', 'Owner B'),
  ('33333333-3333-4333-8333-333333333333', 'Employee A');

insert into public.organizations (id, name, slug, status) values
  ('aaaaaaaa-0000-4000-8000-000000000000', 'Org A', 'org-a', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000000', 'Org B', 'org-b', 'active');

insert into public.organization_members (organization_id, user_id, role, status) values
  ('aaaaaaaa-0000-4000-8000-000000000000', '11111111-1111-4111-8111-111111111111', 'owner', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000000', '22222222-2222-4222-8222-222222222222', 'owner', 'active'),
  ('aaaaaaaa-0000-4000-8000-000000000000', '33333333-3333-4333-8333-333333333333', 'employee', 'active');

insert into public.customers (id, organization_id, full_name, phone_raw, phone_normalized) values
  ('ca000000-0000-4000-8000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000000', 'Cliente A', '8888-0001', '+50688880001'),
  ('cb000000-0000-4000-8000-000000000000', 'bbbbbbbb-0000-4000-8000-000000000000', 'Cliente B', '7777-0001', '+50677770001');

insert into public.loyalty_programs (id, organization_id, name, status) values
  ('90000000-0000-4000-8000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000000', 'Programa A', 'active');

-- --- Impersonar Owner A -----------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

select is(
  (select count(*)::int from public.customers),
  1,
  'Owner A solo ve los clientes de la organización A'
);
select is(
  (select organization_id from public.customers limit 1),
  'aaaaaaaa-0000-4000-8000-000000000000'::uuid,
  'El cliente visible pertenece a la organización A'
);

-- --- Impersonar Owner B -----------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;

select is(
  (select count(*)::int from public.customers),
  1,
  'Owner B solo ve los clientes de la organización B (no los de A)'
);

-- --- Employee de A no puede modificar programas -----------------------------
reset role;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
set local role authenticated;

-- RLS bloquea el UPDATE (0 filas afectadas, sin error).
update public.loyalty_programs set name = 'hackeado'
  where id = '90000000-0000-4000-8000-000000000000';

reset role;
select is(
  (select name from public.loyalty_programs where id = '90000000-0000-4000-8000-000000000000'),
  'Programa A',
  'Un employee no puede modificar el programa (nombre intacto)'
);

select * from finish();
rollback;
