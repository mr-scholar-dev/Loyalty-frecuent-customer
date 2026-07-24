import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/supabase/auth";

/**
 * Kanban data layer (Supabase, under the user's session / RLS → own org).
 * The board is created lazily on first visit with three default columns.
 */

export interface KanbanCard {
  id: string;
  title: string;
  description: string | null;
}
export interface KanbanColumn {
  id: string;
  name: string;
  cards: KanbanCard[];
}
export interface KanbanBoardView {
  boardId: string;
  organizationId: string;
  columns: KanbanColumn[];
}

const DEFAULT_COLUMNS = ["Por hacer", "En progreso", "Hecho"];

export async function getBoard(): Promise<KanbanBoardView | null> {
  const membership = await getActiveMembership();
  if (!membership) return null;
  const orgId = membership.organizationId;
  const supabase = await createClient();

  let { data: board } = await supabase
    .from("kanban_boards")
    .select("id")
    .eq("organization_id", orgId)
    .limit(1)
    .maybeSingle();

  if (!board) {
    const { data: created } = await supabase
      .from("kanban_boards")
      .insert({ organization_id: orgId, name: "Operaciones" })
      .select("id")
      .single();
    board = created;
    if (board) {
      await supabase.from("kanban_columns").insert(
        DEFAULT_COLUMNS.map((name, i) => ({
          board_id: board!.id,
          organization_id: orgId,
          name,
          position: i,
        })),
      );
    }
  }
  if (!board) return null;

  const { data: columns } = await supabase
    .from("kanban_columns")
    .select("id, name, position")
    .eq("board_id", board.id)
    .order("position", { ascending: true });

  // One board per org (MVP), so scoping cards by organization is sufficient.
  const { data: cards } = await supabase
    .from("kanban_cards")
    .select("id, title, description, column_id, position")
    .eq("organization_id", orgId)
    .order("position", { ascending: true });

  const cardsByColumn = new Map<string, KanbanCard[]>();
  for (const c of cards ?? []) {
    const list = cardsByColumn.get(c.column_id) ?? [];
    list.push({ id: c.id, title: c.title, description: c.description });
    cardsByColumn.set(c.column_id, list);
  }

  return {
    boardId: board.id,
    organizationId: orgId,
    columns: (columns ?? []).map((col) => ({
      id: col.id,
      name: col.name,
      cards: cardsByColumn.get(col.id) ?? [],
    })),
  };
}
