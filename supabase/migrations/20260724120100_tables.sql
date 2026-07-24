-- ============================================================================
-- Fase 1 · Tablas, constraints e índices (modelo de datos §7)
-- Multiempresa: toda entidad operativa lleva organization_id (§5).
-- ============================================================================

-- organizations --------------------------------------------------------------
create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  status          public.organization_status not null default 'trial',
  logo_url        text,
  primary_color   text not null default '#2563eb',
  secondary_color text not null default '#0ea5e9',
  timezone        text not null default 'America/Costa_Rica',
  locale          text not null default 'es-CR',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- profiles (complementa auth.users) ------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  platform_role public.platform_role,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- branches -------------------------------------------------------------------
create table public.branches (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  code            text not null,
  address         text,
  phone           text,
  status          public.branch_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, code)
);
create index branches_organization_id_idx on public.branches (organization_id);

-- organization_members -------------------------------------------------------
create table public.organization_members (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  role              public.member_role not null,
  status            public.member_status not null default 'invited',
  default_branch_id uuid references public.branches(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index organization_members_user_id_idx on public.organization_members (user_id);
create index organization_members_organization_id_idx on public.organization_members (organization_id);

-- member_branches (acceso por sucursal) --------------------------------------
create table public.member_branches (
  organization_member_id uuid not null references public.organization_members(id) on delete cascade,
  branch_id              uuid not null references public.branches(id) on delete cascade,
  primary key (organization_member_id, branch_id)
);

-- customers ------------------------------------------------------------------
create table public.customers (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  full_name         text not null,
  phone_raw         text not null,
  phone_normalized  text not null,
  email             text,
  status            public.customer_status not null default 'active',
  marketing_consent boolean not null default false,
  privacy_consent_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Unicidad por organización, no global (§7).
  unique (organization_id, phone_normalized)
);
create index customers_organization_id_idx on public.customers (organization_id);

-- vehicles -------------------------------------------------------------------
create table public.vehicles (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  customer_id              uuid not null references public.customers(id) on delete cascade,
  license_plate_raw        text not null,
  license_plate_normalized text not null,
  vehicle_type             text,
  brand                    text,
  model                    text,
  color                    text,
  status                   public.vehicle_status not null default 'active',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (organization_id, license_plate_normalized)
);
create index vehicles_organization_id_idx on public.vehicles (organization_id);
create index vehicles_customer_id_idx on public.vehicles (customer_id);

-- loyalty_programs -----------------------------------------------------------
create table public.loyalty_programs (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations(id) on delete cascade,
  name                   text not null,
  description            text,
  program_type           public.program_type not null default 'visit_count',
  paid_visits_required   integer not null default 9 check (paid_visits_required >= 1),
  reward_quantity        integer not null default 1 check (reward_quantity >= 1),
  reward_name            text not null default 'Lavado gratis',
  cycle_behavior         public.cycle_behavior not null default 'rolling_cycle',
  reward_expiration_days integer check (reward_expiration_days is null or reward_expiration_days > 0),
  status                 public.program_status not null default 'draft',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index loyalty_programs_organization_id_idx on public.loyalty_programs (organization_id);
-- MVP: solo un programa activo por organización (§7).
create unique index loyalty_programs_one_active_per_org
  on public.loyalty_programs (organization_id)
  where status = 'active';

-- memberships (tarjeta) ------------------------------------------------------
create table public.memberships (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  customer_id        uuid not null references public.customers(id) on delete cascade,
  vehicle_id         uuid not null references public.vehicles(id) on delete cascade,
  loyalty_program_id uuid not null references public.loyalty_programs(id) on delete restrict,
  -- El token público real nunca se guarda en claro: hash + prefijo (§9).
  public_token_hash   text not null unique,
  public_token_prefix text not null,
  status             public.membership_status not null default 'active',
  joined_at          timestamptz not null default now(),
  last_activity_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (loyalty_program_id, vehicle_id)
);
create index memberships_organization_id_idx on public.memberships (organization_id);
create index memberships_customer_id_idx on public.memberships (customer_id);
create index memberships_vehicle_id_idx on public.memberships (vehicle_id);

-- loyalty_events (ledger / libro mayor) --------------------------------------
create table public.loyalty_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  membership_id   uuid not null references public.memberships(id) on delete cascade,
  branch_id       uuid references public.branches(id) on delete set null,
  event_type      public.loyalty_event_type not null,
  points_delta    integer not null default 0,
  reward_delta    integer not null default 0,
  source_event_id uuid references public.loyalty_events(id) on delete set null,
  performed_by    uuid references auth.users(id) on delete set null,
  idempotency_key text,
  notes           text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index loyalty_events_organization_id_idx on public.loyalty_events (organization_id);
create index loyalty_events_membership_id_idx on public.loyalty_events (membership_id);
create index loyalty_events_created_at_idx on public.loyalty_events (created_at);
-- Idempotencia: única cuando no es nula (§7, §12).
create unique index loyalty_events_idempotency_key_key
  on public.loyalty_events (idempotency_key)
  where idempotency_key is not null;

-- membership_balances (proyección rápida) ------------------------------------
create table public.membership_balances (
  membership_id           uuid primary key references public.memberships(id) on delete cascade,
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  paid_visits_in_cycle    integer not null default 0,
  available_rewards       integer not null default 0,
  lifetime_paid_visits    integer not null default 0,
  lifetime_rewards_earned integer not null default 0,
  lifetime_rewards_redeemed integer not null default 0,
  version                 integer not null default 1,
  updated_at              timestamptz not null default now()
);
create index membership_balances_organization_id_idx on public.membership_balances (organization_id);

-- reward_redemptions ---------------------------------------------------------
create table public.reward_redemptions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  membership_id   uuid not null references public.memberships(id) on delete cascade,
  branch_id       uuid references public.branches(id) on delete set null,
  reward_event_id uuid references public.loyalty_events(id) on delete set null,
  redeemed_by     uuid references auth.users(id) on delete set null,
  status          public.redemption_status not null default 'completed',
  notes           text,
  redeemed_at     timestamptz not null default now(),
  reversed_at     timestamptz
);
create index reward_redemptions_organization_id_idx on public.reward_redemptions (organization_id);
create index reward_redemptions_membership_id_idx on public.reward_redemptions (membership_id);

-- audit_logs -----------------------------------------------------------------
create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id   uuid references auth.users(id) on delete set null,
  action          text not null,
  entity_type     text not null,
  entity_id       uuid,
  before_data     jsonb,
  after_data      jsonb,
  ip_hash         text,
  user_agent      text,
  created_at      timestamptz not null default now()
);
create index audit_logs_organization_id_idx on public.audit_logs (organization_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at);

-- card_recovery_codes --------------------------------------------------------
create table public.card_recovery_codes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid not null references public.customers(id) on delete cascade,
  code_hash       text not null,
  expires_at      timestamptz not null,
  attempt_count   integer not null default 0,
  used_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index card_recovery_codes_customer_id_idx on public.card_recovery_codes (customer_id);

-- updated_at automático ------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.branches
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.loyalty_programs
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();
