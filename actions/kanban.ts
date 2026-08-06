"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembership, hasPaidAccess } from "@/lib/supabase/auth";
import type { KanbanPriority } from "@/lib/loyalty/kanban";

/**
 * Kanban actions. Run under the user's session — RLS scopes everything to the
 * member's organization. Inserts derive organization_id from the session.
 */

export type KanbanResult = { ok: true } | { ok: false; message: string };

async function orgId(): Promise<string | null> {
  // Payment gate: block writes from unpaid organizations.
  if (!(await hasPaidAccess())) return null;
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

export async function updateCard(
  cardId: string,
  patch: {
    title: string;
    description: string;
    assigneeId: string | null;
    priority?: KanbanPriority | null;
    dueDate?: string | null;
  },
): Promise<KanbanResult> {
  if (!patch.title.trim())
    return { ok: false, message: "El título es obligatorio." };
  const supabase = await createClient();
  const base = {
    title: patch.title.trim(),
    description: patch.description.trim() || null,
    assignee_id: patch.assigneeId,
  };
  const { data, error } = await supabase
    .from("kanban_cards")
    .update({
      ...base,
      priority: patch.priority ?? null,
      due_date: patch.dueDate || null,
    })
    .eq("id", cardId)
    .select("id");

  if (error) {
    // Database predating the priority/due-date migration: save the rest rather
    // than losing the user's edit.
    const legacy = await supabase
      .from("kanban_cards")
      .update(base)
      .eq("id", cardId)
      .select("id");
    if (legacy.error || !legacy.data?.length)
      return { ok: false, message: "No se pudo actualizar la tarjeta." };
    revalidatePath("/dashboard/kanban");
    return { ok: true };
  }
  if (!data?.length)
    return { ok: false, message: "No se pudo actualizar la tarjeta." };
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
