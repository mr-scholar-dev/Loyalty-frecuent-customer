-- ============================================================================
-- pgTAP · RLS habilitado en tablas sensibles + helpers existen (§17, Fase 1)
-- Ejecutar con: supabase test db
-- ============================================================================
begin;
select plan(18);

-- Todas las tablas con datos de tenant tienen RLS habilitado ------------------
select is((select relrowsecurity from pg_class where oid = 'public.organizations'::regclass),        true, 'RLS: organizations');
select is((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),             true, 'RLS: profiles');
select is((select relrowsecurity from pg_class where oid = 'public.branches'::regclass),             true, 'RLS: branches');
select is((select relrowsecurity from pg_class where oid = 'public.organization_members'::regclass), true, 'RLS: organization_members');
select is((select relrowsecurity from pg_class where oid = 'public.member_branches'::regclass),      true, 'RLS: member_branches');
select is((select relrowsecurity from pg_class where oid = 'public.customers'::regclass),            true, 'RLS: customers');
select is((select relrowsecurity from pg_class where oid = 'public.vehicles'::regclass),             true, 'RLS: vehicles');
select is((select relrowsecurity from pg_class where oid = 'public.loyalty_programs'::regclass),     true, 'RLS: loyalty_programs');
select is((select relrowsecurity from pg_class where oid = 'public.memberships'::regclass),          true, 'RLS: memberships');
select is((select relrowsecurity from pg_class where oid = 'public.loyalty_events'::regclass),       true, 'RLS: loyalty_events');
select is((select relrowsecurity from pg_class where oid = 'public.membership_balances'::regclass),  true, 'RLS: membership_balances');
select is((select relrowsecurity from pg_class where oid = 'public.reward_redemptions'::regclass),   true, 'RLS: reward_redemptions');
select is((select relrowsecurity from pg_class where oid = 'public.audit_logs'::regclass),           true, 'RLS: audit_logs');
select is((select relrowsecurity from pg_class where oid = 'public.card_recovery_codes'::regclass),  true, 'RLS: card_recovery_codes');

-- Los helpers de RLS existen -------------------------------------------------
select has_function('public', 'is_platform_admin', 'is_platform_admin existe');
select has_function('public', 'is_org_member', array['uuid'], 'is_org_member(uuid) existe');
select has_function('public', 'has_org_role', array['uuid', 'member_role[]'], 'has_org_role existe');
select has_function('public', 'has_branch_access', array['uuid'], 'has_branch_access existe');

select * from finish();
rollback;
