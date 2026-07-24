-- ============================================================================
-- Fase 1 · Row Level Security (§17)
--
-- Principios:
--   * Aislamiento multiempresa aplicado en la BD, no en el frontend (§5).
--   * Mínimo privilegio. Balances, eventos, canjes y códigos de recuperación
--     NO son modificables directamente por el cliente: se cambian vía RPC
--     transaccional (SECURITY DEFINER, Fase 3) o service role.
--   * `anon` no recibe permisos: las páginas públicas operan en el servidor con
--     service role, evitando enumeración de clientes.
-- ============================================================================

grant usage on schema public to authenticated;

-- Habilitar RLS en todas las tablas ------------------------------------------
alter table public.organizations        enable row level security;
alter table public.profiles             enable row level security;
alter table public.branches             enable row level security;
alter table public.organization_members enable row level security;
alter table public.member_branches      enable row level security;
alter table public.customers            enable row level security;
alter table public.vehicles             enable row level security;
alter table public.loyalty_programs     enable row level security;
alter table public.memberships          enable row level security;
alter table public.loyalty_events       enable row level security;
alter table public.membership_balances  enable row level security;
alter table public.reward_redemptions   enable row level security;
alter table public.audit_logs           enable row level security;
alter table public.card_recovery_codes  enable row level security;

-- Grants (RLS sigue gobernando cada fila) ------------------------------------
grant select, insert, update, delete on
  public.organizations, public.branches, public.organization_members,
  public.member_branches, public.customers, public.vehicles,
  public.loyalty_programs, public.memberships
  to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on
  public.loyalty_events, public.membership_balances,
  public.reward_redemptions, public.audit_logs
  to authenticated;
-- card_recovery_codes: sin grants (solo service role).

-- ============================================================================
-- organizations
-- ============================================================================
create policy organizations_select on public.organizations
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(id));
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (public.is_platform_admin());
create policy organizations_update on public.organizations
  for update to authenticated
  using (public.is_platform_admin() or public.has_org_role(id, array['owner']::public.member_role[]))
  with check (public.is_platform_admin() or public.has_org_role(id, array['owner']::public.member_role[]));
create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.is_platform_admin());

-- ============================================================================
-- profiles (cada quien su propio perfil)
-- ============================================================================
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_platform_admin())
  with check (id = auth.uid() or public.is_platform_admin());

-- ============================================================================
-- branches (lectura: miembros; escritura: owner)
-- ============================================================================
create policy branches_select on public.branches
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy branches_write on public.branches
  for all to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner']::public.member_role[]))
  with check (public.is_platform_admin() or public.has_org_role(organization_id, array['owner']::public.member_role[]));

-- ============================================================================
-- organization_members (lectura: miembros; escritura: owner)
-- ============================================================================
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy organization_members_write on public.organization_members
  for all to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner']::public.member_role[]))
  with check (public.is_platform_admin() or public.has_org_role(organization_id, array['owner']::public.member_role[]));

-- ============================================================================
-- member_branches (org derivada de organization_members)
-- ============================================================================
create policy member_branches_select on public.member_branches
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members om
      where om.id = organization_member_id
        and public.is_org_member(om.organization_id)
    )
  );
create policy member_branches_write on public.member_branches
  for all to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members om
      where om.id = organization_member_id
        and public.has_org_role(om.organization_id, array['owner']::public.member_role[])
    )
  )
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_members om
      where om.id = organization_member_id
        and public.has_org_role(om.organization_id, array['owner']::public.member_role[])
    )
  );

-- ============================================================================
-- customers (lectura: miembros; escritura: owner/manager; borrado: owner)
-- ============================================================================
create policy customers_select on public.customers
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy customers_insert on public.customers
  for insert to authenticated
  with check (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy customers_update on public.customers
  for update to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]))
  with check (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy customers_delete on public.customers
  for delete to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner']::public.member_role[]));

-- ============================================================================
-- vehicles (igual que customers)
-- ============================================================================
create policy vehicles_select on public.vehicles
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy vehicles_insert on public.vehicles
  for insert to authenticated
  with check (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy vehicles_update on public.vehicles
  for update to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]))
  with check (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy vehicles_delete on public.vehicles
  for delete to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner']::public.member_role[]));

-- ============================================================================
-- loyalty_programs (lectura: miembros; escritura: SOLO owner)
-- Cumple: employee y manager no pueden modificar programas.
-- ============================================================================
create policy loyalty_programs_select on public.loyalty_programs
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy loyalty_programs_write on public.loyalty_programs
  for all to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner']::public.member_role[]))
  with check (public.is_platform_admin() or public.has_org_role(organization_id, array['owner']::public.member_role[]));

-- ============================================================================
-- memberships (lectura: miembros; escritura: owner/manager; borrado: owner)
-- ============================================================================
create policy memberships_select on public.memberships
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id));
create policy memberships_insert on public.memberships
  for insert to authenticated
  with check (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy memberships_update on public.memberships
  for update to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]))
  with check (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));
create policy memberships_delete on public.memberships
  for delete to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner']::public.member_role[]));

-- ============================================================================
-- loyalty_events (solo lectura para clientes; escritura vía RPC/service role)
-- No hay políticas de escritura: el ledger no se altera directamente (§17).
-- ============================================================================
create policy loyalty_events_select on public.loyalty_events
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id));

-- ============================================================================
-- membership_balances (solo lectura; el balance no se modifica directamente)
-- ============================================================================
create policy membership_balances_select on public.membership_balances
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id));

-- ============================================================================
-- reward_redemptions (solo lectura; escritura vía RPC)
-- ============================================================================
create policy reward_redemptions_select on public.reward_redemptions
  for select to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id));

-- ============================================================================
-- audit_logs (lectura: owner/manager; escritura vía service/definer)
-- ============================================================================
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_platform_admin() or public.has_org_role(organization_id, array['owner','manager']::public.member_role[]));

-- ============================================================================
-- card_recovery_codes: RLS habilitado y SIN políticas => acceso denegado a
-- authenticated/anon. Solo el service role (que salta RLS) puede operar.
-- ============================================================================
