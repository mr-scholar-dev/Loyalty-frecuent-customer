-- ============================================================================
-- Fase 1 · Helpers de RLS (§17)
--
-- SECURITY DEFINER + search_path fijo: leen las tablas de membresía saltándose
-- RLS, evitando recursión infinita cuando las políticas de esas mismas tablas
-- invocan estos helpers. STABLE porque no mutan y dependen de auth.uid().
-- ============================================================================

-- ¿El usuario actual es superadmin de plataforma?
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.platform_role = 'superadmin'
  );
$$;

-- ¿El usuario actual es miembro activo de la organización?
create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- ¿El usuario actual tiene alguno de los roles indicados en la organización?
create or replace function public.has_org_role(p_org uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

-- ¿El usuario actual puede operar sobre esta sucursal?
-- owner/manager: todas las de su organización; employee: solo las asignadas.
create or replace function public.has_branch_access(p_branch uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.branches b
    join public.organization_members m
      on m.organization_id = b.organization_id
    where b.id = p_branch
      and m.user_id = auth.uid()
      and m.status = 'active'
      and (
        m.role in ('owner', 'manager')
        or exists (
          select 1
          from public.member_branches mb
          where mb.organization_member_id = m.id
            and mb.branch_id = b.id
        )
      )
  );
$$;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, public.member_role[]) from public;
revoke all on function public.has_branch_access(uuid) from public;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.member_role[]) to authenticated;
grant execute on function public.has_branch_access(uuid) to authenticated;
