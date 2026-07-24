import "server-only";
import type { ToolSpec } from "./openrouter";
import { getAtRiskCustomers, getBusinessContext } from "./insights";
import { listMemberships } from "@/lib/loyalty/admin-queries";
import { getBoard } from "@/lib/loyalty/kanban";
import { getActiveMembership } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Agent tools. The model calls these; we run them SERVER-side under the user's
 * session, so every read/write is RLS-scoped to the caller's organization.
 * Read tools give the assistant knowledge of the whole app; write tools let it
 * act (e.g. create Kanban tasks).
 */

export const TOOL_SPECS: ToolSpec[] = [
  {
    type: "function",
    function: {
      name: "get_business_summary",
      description:
        "Métricas actuales del servicentro: clientes, lavados del día y del mes, recompensas y clientes en riesgo. Úsalo para responder cómo va el negocio.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_at_risk_customers",
      description:
        "Lista de clientes activos que no vuelven hace 30+ días, con su progreso hacia la recompensa. Úsalo para campañas de reactivación.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "search_customers",
      description:
        "Busca clientes por nombre, placa o teléfono. Devuelve estado, progreso y última actividad.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Nombre, placa o teléfono." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_kanban_board",
      description:
        "El tablero Kanban: columnas, tarjetas existentes y miembros del equipo (para asignar).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_kanban_task",
      description:
        "Crea una tarea en el tablero Kanban. Puedes indicar la columna (por nombre) y asignarla a un empleado (por nombre). Si no se indica columna, va a la primera.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título de la tarea." },
          description: { type: "string", description: "Detalle (opcional)." },
          column: {
            type: "string",
            description: "Nombre de la columna (opcional).",
          },
          assignee: {
            type: "string",
            description: "Nombre del empleado a asignar (opcional).",
          },
        },
        required: ["title"],
      },
    },
  },
];

export interface ToolRunResult {
  result: string;
  didWrite: boolean;
}

function argObject(argsJson: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(argsJson);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore malformed args */
  }
  return {};
}

function argStr(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  return typeof v === "string" ? v.trim() : "";
}

const ok = (result: string, didWrite = false): ToolRunResult => ({
  result,
  didWrite,
});

export async function runTool(
  name: string,
  argsJson: string,
): Promise<ToolRunResult> {
  const args = argObject(argsJson);
  const nowIso = new Date().toISOString();

  switch (name) {
    case "get_business_summary":
      return ok(await getBusinessContext(nowIso));

    case "list_at_risk_customers": {
      const list = await getAtRiskCustomers(nowIso);
      return ok(
        JSON.stringify(
          list.map((c) => ({
            nombre: c.name,
            placa: c.licensePlate,
            dias_sin_volver: c.daysSinceLast,
            progreso: `${c.current}/${c.required}`,
          })),
        ),
      );
    }

    case "search_customers": {
      const query = argStr(args, "query");
      if (!query) return ok("Error: falta el término de búsqueda.");
      const items = await listMemberships({ query });
      return ok(
        JSON.stringify(
          items.slice(0, 15).map((i) => ({
            nombre: i.customerFullName,
            placa: i.licensePlate,
            telefono: i.phoneNormalized,
            estado: i.status,
            progreso: `${i.progress.current}/${i.progress.required}`,
            ultima_actividad: i.lastActivityAt,
          })),
        ),
      );
    }

    case "get_kanban_board": {
      const board = await getBoard();
      if (!board) return ok("No hay tablero disponible.");
      return ok(
        JSON.stringify({
          columnas: board.columns.map((c) => ({
            nombre: c.name,
            tareas: c.cards.map((card) => card.title),
          })),
          miembros: board.members.map((m) => m.name),
        }),
      );
    }

    case "create_kanban_task": {
      // Org scoping comes from the user's session (one getUser). All DB work
      // below uses the ADMIN client (service key, no user session) so this long
      // action never refreshes/rotates the user's token — which is what made
      // Supabase revoke the session and log the user out.
      const membership = await getActiveMembership();
      if (!membership) return ok("Error: sesión no válida.");
      const org = membership.organizationId;
      const title = argStr(args, "title");
      if (!title) return ok("Error: la tarea necesita un título.");

      const admin = createAdminClient();

      // Board (created lazily elsewhere; nothing to do here if missing).
      const { data: board } = await admin
        .from("kanban_boards")
        .select("id")
        .eq("organization_id", org)
        .limit(1)
        .maybeSingle();
      if (!board) return ok("Error: abre el Kanban primero para crear el tablero.");

      const { data: columns } = await admin
        .from("kanban_columns")
        .select("id, name")
        .eq("board_id", board.id)
        .order("position", { ascending: true });
      if (!columns || columns.length === 0)
        return ok("Error: el tablero no tiene columnas.");

      const colName = argStr(args, "column").toLowerCase();
      const column =
        (colName
          ? columns.find((c) => c.name.toLowerCase().includes(colName))
          : undefined) ?? columns[0];
      if (!column) return ok("Error: no se encontró la columna.");

      // Resolve assignee by name (admin bypasses RLS on profiles).
      const assigneeName = argStr(args, "assignee").toLowerCase();
      let assigneeId: string | null = null;
      let assigneeLabel = "";
      if (assigneeName) {
        const { data: rows } = await admin
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", org)
          .eq("status", "active");
        const ids = (rows ?? []).map((r) => r.user_id);
        if (ids.length) {
          const { data: profiles } = await admin
            .from("profiles")
            .select("id, full_name")
            .in("id", ids);
          const match = (profiles ?? []).find((p) =>
            (p.full_name ?? "").toLowerCase().includes(assigneeName),
          );
          if (match) {
            assigneeId = match.id;
            assigneeLabel = match.full_name ?? "";
          }
        }
      }

      const { count } = await admin
        .from("kanban_cards")
        .select("id", { count: "exact", head: true })
        .eq("column_id", column.id);

      const { error } = await admin.from("kanban_cards").insert({
        column_id: column.id,
        organization_id: org,
        title,
        description: argStr(args, "description") || null,
        assignee_id: assigneeId,
        position: count ?? 0,
      });
      if (error) return ok("Error: no se pudo crear la tarea.");

      return ok(
        `Tarea "${title}" creada en la columna "${column.name}"` +
          (assigneeLabel ? ` y asignada a ${assigneeLabel}` : "") +
          ".",
        true,
      );
    }

    default:
      return ok(`Herramienta desconocida: ${name}`);
  }
}
