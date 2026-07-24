-- ============================================================================
-- Fase 8 · RPC administrativos transaccionales (§17)
--
-- Mueven bloqueo/reactivación/reemisión/archivado a funciones SECURITY DEFINER
-- que verifican el rol (owner/manager) y escriben la auditoría en la MISMA
-- transacción que el cambio de estado. Antes se hacían con update (RLS) +
-- insert de auditoría por separado desde el servidor.
-- ============================================================================

-- Bloquear / reactivar una membresía ----------------------------------------
create or replace function public.set_membership_status(
  p_membership_id uuid,
  p_status public.membership_status
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.memberships where id = p_membership_id;
  if v_org is null then
    raise exception 'membership_not_found' using errcode = 'P0002';
  end if;
  if not (public.is_platform_admin()
       or public.has_org_role(v_org, array['owner','manager']::public.member_role[])) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  update public.memberships set status = p_status where id = p_membership_id;

  insert into public.audit_logs
    (organization_id, actor_user_id, action, entity_type, entity_id, after_data)
  values
    (v_org, auth.uid(),
     case when p_status = 'blocked' then 'membership.block'
          when p_status = 'active' then 'membership.reactivate'
          else 'membership.status' end,
     'membership', p_membership_id, jsonb_build_object('status', p_status));

  return jsonb_build_object('ok', true);
end;
$$;

-- Reemitir tarjeta (el hash/prefijo se calculan en la app con el secreto) ----
create or replace function public.reissue_membership(
  p_membership_id uuid,
  p_new_hash text,
  p_new_prefix text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.memberships where id = p_membership_id;
  if v_org is null then
    raise exception 'membership_not_found' using errcode = 'P0002';
  end if;
  if not (public.is_platform_admin()
       or public.has_org_role(v_org, array['owner','manager']::public.member_role[])) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  update public.memberships
    set public_token_hash = p_new_hash, public_token_prefix = p_new_prefix
    where id = p_membership_id;

  insert into public.audit_logs
    (organization_id, actor_user_id, action, entity_type, entity_id, after_data)
  values
    (v_org, auth.uid(), 'membership.reissue', 'membership', p_membership_id,
     jsonb_build_object('note', 'Tarjeta reemitida (token anterior revocado)'));

  return jsonb_build_object('ok', true);
end;
$$;

-- Archivar / restaurar cliente (soft-delete) --------------------------------
create or replace function public.set_customer_archived(
  p_membership_id uuid,
  p_archived boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_customer uuid;
begin
  select organization_id, customer_id into v_org, v_customer
    from public.memberships where id = p_membership_id;
  if v_org is null then
    raise exception 'membership_not_found' using errcode = 'P0002';
  end if;
  if not (public.is_platform_admin()
       or public.has_org_role(v_org, array['owner','manager']::public.member_role[])) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  update public.customers
    set status = (case when p_archived then 'archived' else 'active' end)::public.customer_status
    where id = v_customer;
  update public.memberships
    set status = (case when p_archived then 'blocked' else 'active' end)::public.membership_status
    where id = p_membership_id;

  insert into public.audit_logs
    (organization_id, actor_user_id, action, entity_type, entity_id, after_data)
  values
    (v_org, auth.uid(),
     case when p_archived then 'customer.archive' else 'customer.unarchive' end,
     'membership', p_membership_id,
     jsonb_build_object('note', case when p_archived then 'Cliente archivado' else 'Cliente restaurado' end));

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.set_membership_status(uuid, public.membership_status) from public;
revoke all on function public.reissue_membership(uuid, text, text) from public;
revoke all on function public.set_customer_archived(uuid, boolean) from public;
grant execute on function public.set_membership_status(uuid, public.membership_status) to authenticated;
grant execute on function public.reissue_membership(uuid, text, text) to authenticated;
grant execute on function public.set_customer_archived(uuid, boolean) to authenticated;
