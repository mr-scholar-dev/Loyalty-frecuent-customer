-- ============================================================================
-- Kanban v2: asignar tarjetas a un miembro del equipo.
-- ============================================================================
alter table public.kanban_cards
  add column assignee_id uuid references auth.users(id) on delete set null;

create index kanban_cards_assignee_id_idx on public.kanban_cards (assignee_id);
