"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/supabase/auth";

/**
 * Kanban actions. Run under the user's session — RLS scopes everything to the
 * member's organization. Inserts derive organization_id from the session.
 */

export type KanbanResult = { ok: true } | { ok: false; message: string };

async function orgId(): Promise<string | null> {
  return (await getActiveMembership())?.organizationId ?? null;
}

export async function addColumn(
  boardId: string,
  name: string,
): Promise<KanbanResult> {
  const org = await orgId();
  if (!org) return { ok: false, message: "Sesión no válida." };
  if (!name.trim()) return { ok: false, message: "El nombre es obligatorio." };
  const supabase = await createClient();
  const { count } = await supabase
    .from("kanban_columns")
    .select("id", { count: "exact", head: true })
    .eq("board_id", boardId);
  const { error } = await supabase.from("kanban_columns").insert({
    board_id: boardId,
    organization_id: org,
    name: name.trim(),
    position: count ?? 0,
  });
  if (error) return { ok: false, message: "No se pudo crear la columna." };
  revalidatePath("/dashboard/kanban");
  return { ok: true };
}

export async function addCard(
  columnId: string,
  title: string,
  description: string,
): Promise<KanbanResult> {
  const org = await orgId();
  if (!org) return { ok: false, message: "Sesión no válida." };
  if (!title.trim()) return { ok: false, message: "El título es obligatorio." };
  const supabase = await createClient();
  const { count } = await supabase
    .from("kanban_cards")
    .select("id", { count: "exact", head: true })
    .eq("column_id", columnId);
  const { error } = await supabase.from("kanban_cards").insert({
    column_id: columnId,
    organization_id: org,
    title: title.trim(),
    description: description.trim() || null,
    position: count ?? 0,
  });
  if (error) return { ok: false, message: "No se pudo crear la tarjeta." };
  revalidatePath("/dashboard/kanban");
  return { ok: true };
}

/** Move a card to another column (appended at the end). */
export async function moveCard(
  cardId: string,
  toColumnId: string,
): Promise<KanbanResult> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("kanban_cards")
    .select("id", { count: "exact", head: true })
    .eq("column_id", toColumnId);
  const { data, error } = await supabase
    .from("kanban_cards")
    .update({ column_id: toColumnId, position: count ?? 0 })
    .eq("id", cardId)
    .select("id");
  if (error || !data?.length)
    return { ok: false, message: "No se pudo mover la tarjeta." };
  revalidatePath("/dashboard/kanban");
  return { ok: true };
}

export async function deleteCard(cardId: string): Promise<KanbanResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kanban_cards")
    .delete()
    .eq("id", cardId);
  if (error) return { ok: false, message: "No se pudo borrar." };
  revalidatePath("/dashboard/kanban");
  return { ok: true };
}

export async function deleteColumn(columnId: string): Promise<KanbanResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kanban_columns")
    .delete()
    .eq("id", columnId);
  if (error) return { ok: false, message: "No se pudo borrar la columna." };
  revalidatePath("/dashboard/kanban");
  return { ok: true };
}
