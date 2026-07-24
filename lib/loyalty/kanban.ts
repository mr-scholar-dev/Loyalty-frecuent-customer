import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveMembership } from "@/lib/supabase/auth";

/**
 * Kanban data layer (Supabase, under the user's session / RLS → own org).
 * The board is created lazily on first visit with three default columns.
 */

export interface KanbanCard {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
}
export interface KanbanColumn {
  id: string;
  name: string;
  cards: KanbanCard[];
}
export interface KanbanMember {
  id: string;
  name: string;
}
export interface KanbanBoardView {
  boardId: string;
  organizationId: string;
  columns: KanbanColumn[];
  members: KanbanMember[];
}

const DEFAULT_COLUMNS = ["Por hacer", "En progreso", "Hecho"];

/** Org member id → name (via admin; RLS blocks reading others' profiles). */
async function getMembers(orgId: string): Promise<KanbanMember[]> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("status", "active");
  const ids = (rows ?? []).map((r) => r.user_id);
  if (!ids.length) return [];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);
  return (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name ?? "Sin nombre",
  }));
}

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

  const [{ data: columns }, { data: cards }, members] = await Promise.all([
    supabase
      .from("kanban_columns")
      .select("id, name, position")
      .eq("board_id", board.id)
      .order("position", { ascending: true }),
    supabase
      .from("kanban_cards")
      .select("id, title, description, column_id, position, assignee_id")
      .eq("organization_id", orgId)
      .order("position", { ascending: true }),
    getMembers(orgId),
  ]);

  const nameById = new Map(members.map((m) => [m.id, m.name]));
  const cardsByColumn = new Map<string, KanbanCard[]>();
  for (const c of cards ?? []) {
    const list = cardsByColumn.get(c.column_id) ?? [];
    list.push({
      id: c.id,
      title: c.title,
      description: c.description,
      assigneeId: c.assignee_id,
      assigneeName: c.assignee_id
        ? (nameById.get(c.assignee_id) ?? null)
        : null,
    });
    cardsByColumn.set(c.column_id, list);
  }

  return {
    boardId: board.id,
    organizationId: orgId,
    members,
    columns: (columns ?? []).map((col) => ({
      id: col.id,
      name: col.name,
      cards: cardsByColumn.get(col.id) ?? [],
    })),
  };
}
