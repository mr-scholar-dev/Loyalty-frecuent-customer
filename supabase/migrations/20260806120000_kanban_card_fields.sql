-- Kanban cards: priority and due date. Both optional.
--
-- The enum is the last line of defense on priority: the board offers a fixed
-- select, but the AI agent writes this column too, and Postgres rejecting an
-- unknown value beats trusting a language model to stay in the set.

create type public.kanban_priority as enum ('low', 'medium', 'high', 'urgent');

alter table public.kanban_cards
  add column if not exists priority public.kanban_priority,
  add column if not exists due_date date;

-- Boards are filtered by column; due-date sorting is a small in-memory step, so
-- only the partial index for outstanding dated cards earns its keep.
create index if not exists kanban_cards_due_date_idx
  on public.kanban_cards (organization_id, due_date)
  where due_date is not null;
