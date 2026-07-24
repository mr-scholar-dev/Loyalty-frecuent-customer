-- ============================================================================
-- Kanban (tablero operativo por organización). RLS org-scoped: cualquier
-- miembro activo de la organización puede gestionar su tablero.
-- ============================================================================

create table public.kanban_boards (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null default 'Operaciones',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index kanban_boards_organization_id_idx on public.kanban_boards (organization_id);

create table public.kanban_columns (
  id              uuid primary key default gen_random_uuid(),
  board_id        uuid not null references public.kanban_boards(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  position        integer not null default 0,
  created_at      timestamptz not null default now()
);
create index kanban_columns_board_id_idx on public.kanban_columns (board_id);
create index kanban_columns_organization_id_idx on public.kanban_columns (organization_id);

create table public.kanban_cards (
  id              uuid primary key default gen_random_uuid(),
  column_id       uuid not null references public.kanban_columns(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title           text not null,
  description     text,
  position        integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index kanban_cards_column_id_idx on public.kanban_cards (column_id);
create index kanban_cards_organization_id_idx on public.kanban_cards (organization_id);

create trigger set_updated_at before update on public.kanban_boards
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.kanban_cards
  for each row execute function public.set_updated_at();

-- RLS ------------------------------------------------------------------------
alter table public.kanban_boards  enable row level security;
alter table public.kanban_columns enable row level security;
alter table public.kanban_cards   enable row level security;

grant select, insert, update, delete on
  public.kanban_boards, public.kanban_columns, public.kanban_cards
  to authenticated;

create policy kanban_boards_all on public.kanban_boards
  for all to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create policy kanban_columns_all on public.kanban_columns
  for all to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));

create policy kanban_cards_all on public.kanban_cards
  for all to authenticated
  using (public.is_platform_admin() or public.is_org_member(organization_id))
  with check (public.is_platform_admin() or public.is_org_member(organization_id));
