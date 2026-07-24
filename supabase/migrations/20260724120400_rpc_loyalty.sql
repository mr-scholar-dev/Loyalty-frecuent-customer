-- ============================================================================
-- Fase 3 · RPC transaccionales de fidelización (§Flujo E/F/G)
--
-- Operaciones críticas ejecutadas como funciones PostgreSQL atómicas:
--   * register_paid_visit  — registra un lavado pagado (§Flujo E)
--   * redeem_reward        — canjea una recompensa (§Flujo F)
--   * reverse_last_visit   — revierte el último lavado (§Flujo G)
--
-- SECURITY DEFINER: saltan RLS, por eso verifican autorización EXPLÍCITAMENTE
-- con los helpers. Bloquean la fila de balance (FOR UPDATE) para serializar
-- operaciones concurrentes por membresía. El ledger es la fuente de verdad;
-- membership_balances es una proyección actualizada en la MISMA transacción.
-- Nunca se borran eventos: las reversiones se registran como eventos inversos.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- register_paid_visit (§Flujo E)
-- ----------------------------------------------------------------------------
create or replace function public.register_paid_visit(
  p_membership_id uuid,
  p_branch_id uuid default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership   public.memberships%rowtype;
  v_program      public.loyalty_programs%rowtype;
  v_balance      public.membership_balances%rowtype;
  v_visit_event  uuid;
  v_reward_earned boolean := false;
begin
  select * into v_membership from public.memberships where id = p_membership_id;
  if not found then
    raise exception 'membership_not_found' using errcode = 'P0002';
  end if;

  -- Autorización explícita (owner/manager/employee de la organización).
  if not (public.is_platform_admin()
       or public.has_org_role(v_membership.organization_id,
            array['owner','manager','employee']::public.member_role[])) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if v_membership.status <> 'active' then
    raise exception 'membership_not_active' using errcode = 'P0001';
  end if;

  if p_branch_id is not null and not exists (
    select 1 from public.branches b
    where b.id = p_branch_id and b.organization_id = v_membership.organization_id
  ) then
    raise exception 'invalid_branch' using errcode = 'P0001';
  end if;

  -- Idempotencia: si la clave ya se procesó, devolver el estado actual.
  if p_idempotency_key is not null and exists (
    select 1 from public.loyalty_events where idempotency_key = p_idempotency_key
  ) then
    select * into v_balance from public.membership_balances where membership_id = p_membership_id;
    return jsonb_build_object('idempotent', true, 'reward_earned', false, 'balance', to_jsonb(v_balance));
  end if;

  select * into v_program from public.loyalty_programs where id = v_membership.loyalty_program_id;

  -- Asegurar y BLOQUEAR la fila de balance.
  insert into public.membership_balances (membership_id, organization_id)
    values (p_membership_id, v_membership.organization_id)
    on conflict (membership_id) do nothing;
  select * into v_balance from public.membership_balances
    where membership_id = p_membership_id
    for update;

  -- Evento: lavado pagado.
  insert into public.loyalty_events
    (organization_id, membership_id, branch_id, event_type, points_delta, performed_by, idempotency_key)
  values
    (v_membership.organization_id, p_membership_id, p_branch_id, 'visit_earned', 1, auth.uid(), p_idempotency_key)
  returning id into v_visit_event;

  v_balance.paid_visits_in_cycle := v_balance.paid_visits_in_cycle + 1;
  v_balance.lifetime_paid_visits := v_balance.lifetime_paid_visits + 1;

  -- ¿Se completó el ciclo? Generar recompensa y reiniciar a 0.
  if v_balance.paid_visits_in_cycle >= v_program.paid_visits_required then
    insert into public.loyalty_events
      (organization_id, membership_id, branch_id, event_type, reward_delta, source_event_id, performed_by)
    values
      (v_membership.organization_id, p_membership_id, p_branch_id, 'reward_earned',
       v_program.reward_quantity, v_visit_event, auth.uid());
    v_balance.available_rewards       := v_balance.available_rewards + v_program.reward_quantity;
    v_balance.lifetime_rewards_earned := v_balance.lifetime_rewards_earned + v_program.reward_quantity;
    v_balance.paid_visits_in_cycle    := 0;
    v_reward_earned := true;
  end if;

  update public.membership_balances set
    paid_visits_in_cycle    = v_balance.paid_visits_in_cycle,
    available_rewards       = v_balance.available_rewards,
    lifetime_paid_visits    = v_balance.lifetime_paid_visits,
    lifetime_rewards_earned = v_balance.lifetime_rewards_earned,
    version                 = version + 1,
    updated_at              = now()
  where membership_id = p_membership_id;

  update public.memberships set last_activity_at = now() where id = p_membership_id;

  insert into public.audit_logs
    (organization_id, actor_user_id, action, entity_type, entity_id, after_data)
  values
    (v_membership.organization_id, auth.uid(), 'visit.register', 'membership', p_membership_id,
     jsonb_build_object('reward_earned', v_reward_earned));

  select * into v_balance from public.membership_balances where membership_id = p_membership_id;
  return jsonb_build_object('idempotent', false, 'reward_earned', v_reward_earned, 'balance', to_jsonb(v_balance));
end;
$$;

-- ----------------------------------------------------------------------------
-- redeem_reward (§Flujo F)
-- ----------------------------------------------------------------------------
create or replace function public.redeem_reward(
  p_membership_id uuid,
  p_branch_id uuid default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership   public.memberships%rowtype;
  v_balance      public.membership_balances%rowtype;
  v_reward_event uuid;
begin
  select * into v_membership from public.memberships where id = p_membership_id;
  if not found then
    raise exception 'membership_not_found' using errcode = 'P0002';
  end if;

  if not (public.is_platform_admin()
       or public.has_org_role(v_membership.organization_id,
            array['owner','manager','employee']::public.member_role[])) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if v_membership.status <> 'active' then
    raise exception 'membership_not_active' using errcode = 'P0001';
  end if;

  if p_branch_id is not null and not exists (
    select 1 from public.branches b
    where b.id = p_branch_id and b.organization_id = v_membership.organization_id
  ) then
    raise exception 'invalid_branch' using errcode = 'P0001';
  end if;

  if p_idempotency_key is not null and exists (
    select 1 from public.loyalty_events where idempotency_key = p_idempotency_key
  ) then
    select * into v_balance from public.membership_balances where membership_id = p_membership_id;
    return jsonb_build_object('idempotent', true, 'balance', to_jsonb(v_balance));
  end if;

  insert into public.membership_balances (membership_id, organization_id)
    values (p_membership_id, v_membership.organization_id)
    on conflict (membership_id) do nothing;
  select * into v_balance from public.membership_balances
    where membership_id = p_membership_id
    for update;

  if v_balance.available_rewards < 1 then
    raise exception 'no_reward_available' using errcode = 'P0001';
  end if;

  insert into public.loyalty_events
    (organization_id, membership_id, branch_id, event_type, reward_delta, performed_by, idempotency_key)
  values
    (v_membership.organization_id, p_membership_id, p_branch_id, 'reward_redeemed', -1, auth.uid(), p_idempotency_key)
  returning id into v_reward_event;

  insert into public.reward_redemptions
    (organization_id, membership_id, branch_id, reward_event_id, redeemed_by, status)
  values
    (v_membership.organization_id, p_membership_id, p_branch_id, v_reward_event, auth.uid(), 'completed');

  update public.membership_balances set
    available_rewards         = available_rewards - 1,
    lifetime_rewards_redeemed = lifetime_rewards_redeemed + 1,
    version                   = version + 1,
    updated_at                = now()
  where membership_id = p_membership_id;

  update public.memberships set last_activity_at = now() where id = p_membership_id;

  insert into public.audit_logs
    (organization_id, actor_user_id, action, entity_type, entity_id)
  values
    (v_membership.organization_id, auth.uid(), 'reward.redeem', 'membership', p_membership_id);

  select * into v_balance from public.membership_balances where membership_id = p_membership_id;
  return jsonb_build_object('idempotent', false, 'balance', to_jsonb(v_balance));
end;
$$;

-- ----------------------------------------------------------------------------
-- reverse_last_visit (§Flujo G)
-- Solo owner/manager · motivo obligatorio · evento inverso · sin doble reversión.
-- Limitación MVP: si el lavado revertido había cruzado un ciclo y generado una
-- recompensa, esta NO se revierte automáticamente; hazlo con un ajuste manual.
-- ----------------------------------------------------------------------------
create or replace function public.reverse_last_visit(
  p_membership_id uuid,
  p_reason text,
  p_branch_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership public.memberships%rowtype;
  v_balance    public.membership_balances%rowtype;
  v_target     uuid;
begin
  select * into v_membership from public.memberships where id = p_membership_id;
  if not found then
    raise exception 'membership_not_found' using errcode = 'P0002';
  end if;

  -- Reversión requiere manager u owner (§Flujo G).
  if not (public.is_platform_admin()
       or public.has_org_role(v_membership.organization_id,
            array['owner','manager']::public.member_role[])) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'reason_required' using errcode = 'P0001';
  end if;

  select * into v_balance from public.membership_balances
    where membership_id = p_membership_id
    for update;

  -- Último visit_earned que aún no fue revertido.
  select e.id into v_target
  from public.loyalty_events e
  where e.membership_id = p_membership_id
    and e.event_type = 'visit_earned'
    and not exists (
      select 1 from public.loyalty_events r
      where r.source_event_id = e.id and r.event_type = 'visit_reversed'
    )
  order by e.created_at desc
  limit 1;

  if v_target is null then
    raise exception 'no_visit_to_reverse' using errcode = 'P0001';
  end if;

  insert into public.loyalty_events
    (organization_id, membership_id, branch_id, event_type, points_delta, source_event_id, performed_by, notes)
  values
    (v_membership.organization_id, p_membership_id, p_branch_id, 'visit_reversed', -1, v_target, auth.uid(), p_reason);

  update public.membership_balances set
    paid_visits_in_cycle = greatest(0, paid_visits_in_cycle - 1),
    lifetime_paid_visits = greatest(0, lifetime_paid_visits - 1),
    version              = version + 1,
    updated_at           = now()
  where membership_id = p_membership_id;

  update public.memberships set last_activity_at = now() where id = p_membership_id;

  insert into public.audit_logs
    (organization_id, actor_user_id, action, entity_type, entity_id, after_data)
  values
    (v_membership.organization_id, auth.uid(), 'visit.reverse', 'membership', p_membership_id,
     jsonb_build_object('reason', p_reason, 'source_event_id', v_target));

  select * into v_balance from public.membership_balances where membership_id = p_membership_id;
  return jsonb_build_object('reversed', true, 'balance', to_jsonb(v_balance));
end;
$$;

-- Permisos: solo usuarios autenticados; la autorización fina es interna.
revoke all on function public.register_paid_visit(uuid, uuid, text) from public;
revoke all on function public.redeem_reward(uuid, uuid, text) from public;
revoke all on function public.reverse_last_visit(uuid, text, uuid) from public;
grant execute on function public.register_paid_visit(uuid, uuid, text) to authenticated;
grant execute on function public.redeem_reward(uuid, uuid, text) to authenticated;
grant execute on function public.reverse_last_visit(uuid, text, uuid) to authenticated;
