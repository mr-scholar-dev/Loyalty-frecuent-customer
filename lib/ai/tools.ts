import "server-only";
import type { ToolSpec } from "./openrouter";
import { getAtRiskCustomers, getBusinessContext } from "./insights";
import {
  getAuditLog,
  getMembershipDetail,
  getVisitLog,
  listMemberships,
} from "@/lib/loyalty/admin-queries";
import { getBoard, isKanbanPriority } from "@/lib/loyalty/kanban";
import { listTeam } from "@/lib/loyalty/team";
import { getActiveMembership } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { EVENT_LABELS } from "@/lib/loyalty/event-format";
import { can, Permission, toMemberRole } from "@/lib/permissions/roles";
import type { MemberRole } from "@/types/domain";

/**
 * Agent capabilities. The model chooses which to call; we execute them
 * server-side under the caller's session, so every read and write stays scoped
 * to their organization.
 *
 * Three properties keep a language model's mistakes from becoming the user's
 * problem:
 *
 *  - Every capability declares the `Permission` it needs, checked against the
 *    caller's role before it runs. The agent can never do more than the person
 *    talking to it is allowed to do.
 *  - Capabilities that destroy or reverse data are marked `destructive`. They
 *    never execute from a tool call; they resolve their target, describe it,
 *    and hand back a signed ticket the human has to approve.
 *  - Writes go through the same server actions and RPCs the UI uses, so
 *    validation and audit rows are identical whether a person or the agent
 *    made the change.
 */

export type Risk = "read" | "write" | "destructive";

export interface ToolContext {
  orgId: string;
  role: MemberRole;
  userId: string;
}

interface Capability {
  spec: ToolSpec;
  risk: Risk;
  /** Required permission; omitted means any active member may call it. */
  permission?: Permission;
  /** Executes the capability and returns text for the model. */
  run(args: Args, ctx: ToolContext): Promise<string>;
  /**
   * Destructive only: resolve the target and describe what would happen.
   * Returns null when the target cannot be found, so the agent can say so
   * instead of asking the user to confirm something that does not exist.
   */
  describe?(args: Args, ctx: ToolContext): Promise<string | null>;
}

type Args = Record<string, unknown>;

// --- arg helpers ------------------------------------------------------------

function str(args: Args, key: string): string {
  const v = args[key];
  return typeof v === "string" ? v.trim() : "";
}

function int(args: Args, key: string): number | null {
  const v = args[key];
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) {
    return Number.parseInt(v.trim(), 10);
  }
  return null;
}

const json = (v: unknown): string => JSON.stringify(v);

// --- shared resolvers -------------------------------------------------------

/**
 * Find one customer from a free-text reference (name, plate or phone). Being
 * strict here matters: acting on the wrong customer is worse than asking again,
 * so an ambiguous match returns the candidates rather than guessing.
 */
async function resolveMembership(
  query: string,
): Promise<
  { ok: true; id: string; label: string } | { ok: false; message: string }
> {
  if (!query) return { ok: false, message: "Falta indicar el cliente." };
  const matches = await listMemberships({ query });
  if (matches.length === 0) {
    return {
      ok: false,
      message: `No se encontró ningún cliente con "${query}".`,
    };
  }
  if (matches.length > 1) {
    const exact = matches.filter(
      (m) => m.licensePlate.toLowerCase() === query.toLowerCase(),
    );
    if (exact.length !== 1) {
      return {
        ok: false,
        message:
          `Hay ${matches.length} clientes que coinciden con "${query}": ` +
          matches
            .slice(0, 8)
            .map((m) => `${m.customerFullName} (${m.licensePlate})`)
            .join(", ") +
          ". Pide al usuario que precise cuál.",
      };
    }
    const only = exact[0]!;
    return {
      ok: true,
      id: only.id,
      label: `${only.customerFullName} (${only.licensePlate})`,
    };
  }
  const only = matches[0]!;
  return {
    ok: true,
    id: only.id,
    label: `${only.customerFullName} (${only.licensePlate})`,
  };
}

/** Find a Kanban card by title (case-insensitive, substring). */
async function resolveCard(
  title: string,
): Promise<
  | { ok: true; id: string; title: string; columnName: string }
  | { ok: false; message: string }
> {
  if (!title) return { ok: false, message: "Falta indicar la tarea." };
  const board = await getBoard();
  if (!board) return { ok: false, message: "No hay tablero disponible." };
  const needle = title.toLowerCase();
  const hits = board.columns.flatMap((col) =>
    col.cards
      .filter((c) => c.title.toLowerCase().includes(needle))
      .map((c) => ({ card: c, columnName: col.name })),
  );
  if (hits.length === 0) {
    return {
      ok: false,
      message: `No hay ninguna tarea que coincida con "${title}".`,
    };
  }
  if (hits.length > 1) {
    return {
      ok: false,
      message:
        `Hay ${hits.length} tareas que coinciden: ` +
        hits.map((h) => `"${h.card.title}"`).join(", ") +
        ". Pide al usuario que precise cuál.",
    };
  }
  const only = hits[0]!;
  return {
    ok: true,
    id: only.card.id,
    title: only.card.title,
    columnName: only.columnName,
  };
}

/** Resolve an org member id from a name fragment. */
async function resolveMember(
  name: string,
  orgId: string,
): Promise<{ id: string; name: string } | null> {
  if (!name) return null;
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("status", "active");
  const ids = (rows ?? []).map((r) => r.user_id);
  if (!ids.length) return null;
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);
  const needle = name.toLowerCase();
  const match = (profiles ?? []).find((p) =>
    (p.full_name ?? "").toLowerCase().includes(needle),
  );
  return match ? { id: match.id, name: match.full_name ?? "" } : null;
}

/**
 * The board's columns via the admin client. Writes use it deliberately: this
 * runs inside a long agent turn, and touching the user's session token here is
 * what previously rotated it mid-request and signed people out.
 */
async function boardColumns(orgId: string) {
  const admin = createAdminClient();
  const { data: board } = await admin
    .from("kanban_boards")
    .select("id")
    .eq("organization_id", orgId)
    .limit(1)
    .maybeSingle();
  if (!board) return null;
  const { data: columns } = await admin
    .from("kanban_columns")
    .select("id, name")
    .eq("board_id", board.id)
    .order("position", { ascending: true });
  if (!columns?.length) return null;
  return { boardId: board.id, columns };
}

function pickColumn<T extends { name: string }>(
  columns: T[],
  wanted: string,
): T | undefined {
  if (!wanted) return columns[0];
  const needle = wanted.toLowerCase();
  return (
    columns.find((c) => c.name.toLowerCase() === needle) ??
    columns.find((c) => c.name.toLowerCase().includes(needle))
  );
}

// --- capability registry ----------------------------------------------------

const CAPABILITIES: Record<string, Capability> = {
  // ---------------------------------------------------------------- reads ---
  get_business_summary: {
    risk: "read",
    spec: {
      type: "function",
      function: {
        name: "get_business_summary",
        description:
          "Métricas actuales del negocio: clientes, lavados del día y del mes, recompensas y clientes en riesgo.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    run: () => getBusinessContext(new Date().toISOString()),
  },

  list_at_risk_customers: {
    risk: "read",
    spec: {
      type: "function",
      function: {
        name: "list_at_risk_customers",
        description:
          "Clientes activos que no vuelven hace 30+ días, con su progreso. Úsalo para campañas de reactivación.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    async run() {
      const list = await getAtRiskCustomers(new Date().toISOString());
      return json(
        list.map((c) => ({
          nombre: c.name,
          placa: c.licensePlate,
          dias_sin_volver: c.daysSinceLast,
          progreso: `${c.current}/${c.required}`,
        })),
      );
    },
  },

  search_customers: {
    risk: "read",
    spec: {
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
    async run(args) {
      const query = str(args, "query");
      if (!query) return "Error: falta el término de búsqueda.";
      const items = await listMemberships({ query });
      return json(
        items.slice(0, 15).map((i) => ({
          nombre: i.customerFullName,
          placa: i.licensePlate,
          telefono: i.phoneNormalized,
          estado: i.status,
          progreso: `${i.progress.current}/${i.progress.required}`,
          recompensas_disponibles: i.progress.availableRewards,
          ultima_actividad: i.lastActivityAt,
        })),
      );
    },
  },

  get_customer_detail: {
    risk: "read",
    permission: Permission.ViewCustomerFull,
    spec: {
      type: "function",
      function: {
        name: "get_customer_detail",
        description:
          "Ficha completa de un cliente (por nombre o placa): progreso, estado e historial reciente de eventos.",
        parameters: {
          type: "object",
          properties: {
            customer: { type: "string", description: "Nombre o placa." },
          },
          required: ["customer"],
        },
      },
    },
    async run(args) {
      const found = await resolveMembership(str(args, "customer"));
      if (!found.ok) return found.message;
      const detail = await getMembershipDetail(found.id);
      if (!detail) return "No se encontró el cliente.";
      return json({
        nombre: detail.customerFullName,
        placa: detail.licensePlate,
        telefono: detail.phoneNormalized,
        estado: detail.status,
        archivado: detail.archived,
        progreso: `${detail.progress.current}/${detail.progress.required}`,
        recompensas_disponibles: detail.progress.availableRewards,
        cliente_desde: detail.joinedAt,
        ultima_actividad: detail.lastActivityAt,
        eventos: detail.events.slice(0, 10).map((e) => ({
          tipo: EVENT_LABELS[e.type],
          fecha: e.at,
        })),
      });
    },
  },

  get_kanban_board: {
    risk: "read",
    spec: {
      type: "function",
      function: {
        name: "get_kanban_board",
        description:
          "El tablero Kanban completo: columnas, tareas con prioridad, fecha límite y responsable, y miembros disponibles para asignar.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    async run() {
      const board = await getBoard();
      if (!board) return "No hay tablero disponible.";
      return json({
        columnas: board.columns.map((c) => ({
          nombre: c.name,
          tareas: c.cards.map((card) => ({
            titulo: card.title,
            descripcion: card.description,
            responsable: card.assigneeName,
            prioridad: card.priority,
            fecha_limite: card.dueDate,
          })),
        })),
        miembros: board.members.map((m) => m.name),
      });
    },
  },

  list_team: {
    risk: "read",
    spec: {
      type: "function",
      function: {
        name: "list_team",
        description:
          "Miembros del equipo con su rol y estado (propietario, encargado, empleado).",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    async run() {
      const team = await listTeam();
      if (!team) return "No se pudo leer el equipo.";
      return json(
        team.members.map((m) => ({
          nombre: m.fullName,
          correo: m.email,
          rol: m.role,
          estado: m.status,
        })),
      );
    },
  },

  get_program: {
    risk: "read",
    spec: {
      type: "function",
      function: {
        name: "get_program",
        description:
          "Configuración del programa de fidelización: nombre, visitas requeridas y recompensa.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    async run(_args, ctx) {
      const supabase = await createClient();
      const { data } = await supabase
        .from("loyalty_programs")
        .select(
          "name, paid_visits_required, reward_quantity, reward_name, status",
        )
        .eq("organization_id", ctx.orgId)
        .limit(1)
        .maybeSingle();
      if (!data) return "No hay programa configurado.";
      return json({
        nombre: data.name,
        visitas_requeridas: data.paid_visits_required,
        recompensa: `${data.reward_quantity} x ${data.reward_name}`,
        estado: data.status,
      });
    },
  },

  list_recent_visits: {
    risk: "read",
    permission: Permission.ViewReports,
    spec: {
      type: "function",
      function: {
        name: "list_recent_visits",
        description: "Últimos movimientos registrados (visitas y recompensas).",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "integer", description: "Cuántos (máx. 30)." },
          },
          required: [],
        },
      },
    },
    async run(args) {
      const limit = Math.min(int(args, "limit") ?? 15, 30);
      const items = await getVisitLog();
      return json(
        items.slice(0, limit).map((v) => ({
          tipo: EVENT_LABELS[v.type],
          cliente: v.customerFullName,
          placa: v.licensePlate,
          fecha: v.at,
        })),
      );
    },
  },

  list_audit_log: {
    risk: "read",
    permission: Permission.ViewReports,
    spec: {
      type: "function",
      function: {
        name: "list_audit_log",
        description:
          "Registro de auditoría: acciones administrativas recientes y quién las hizo.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "integer", description: "Cuántas (máx. 30)." },
          },
          required: [],
        },
      },
    },
    async run(args) {
      const limit = Math.min(int(args, "limit") ?? 15, 30);
      const entries = await getAuditLog();
      return json(entries.slice(0, limit));
    },
  },

  // --------------------------------------------------------------- writes ---
  create_kanban_task: {
    risk: "write",
    spec: {
      type: "function",
      function: {
        name: "create_kanban_task",
        description:
          "Crea una tarea en el tablero Kanban. Puedes indicar columna, responsable, prioridad y fecha límite.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título de la tarea." },
            description: { type: "string", description: "Detalle (opcional)." },
            column: {
              type: "string",
              description:
                "Nombre de la columna (opcional, por defecto la primera).",
            },
            assignee: {
              type: "string",
              description: "Nombre del empleado a asignar (opcional).",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Prioridad (opcional).",
            },
            due_date: {
              type: "string",
              description: "Fecha límite en formato AAAA-MM-DD (opcional).",
            },
          },
          required: ["title"],
        },
      },
    },
    async run(args, ctx) {
      const title = str(args, "title");
      if (!title) return "Error: la tarea necesita un título.";

      const board = await boardColumns(ctx.orgId);
      if (!board) return "Error: abre el Kanban primero para crear el tablero.";
      const column = pickColumn(board.columns, str(args, "column"));
      if (!column) return "Error: no se encontró la columna indicada.";

      const assignee = await resolveMember(str(args, "assignee"), ctx.orgId);
      const admin = createAdminClient();
      const { count } = await admin
        .from("kanban_cards")
        .select("id", { count: "exact", head: true })
        .eq("column_id", column.id);

      const priority = str(args, "priority");
      const dueDate = str(args, "due_date");
      const base = {
        column_id: column.id,
        organization_id: ctx.orgId,
        title,
        description: str(args, "description") || null,
        assignee_id: assignee?.id ?? null,
        position: count ?? 0,
      };

      let { error } = await admin.from("kanban_cards").insert({
        ...base,
        priority: isKanbanPriority(priority) ? priority : null,
        due_date: dueDate || null,
      });
      if (error) {
        // Database without the priority/due-date migration.
        ({ error } = await admin.from("kanban_cards").insert(base));
      }
      if (error) return "Error: no se pudo crear la tarea.";

      return (
        `Tarea "${title}" creada en "${column.name}"` +
        (assignee ? ` y asignada a ${assignee.name}` : "") +
        "."
      );
    },
  },

  update_kanban_task: {
    risk: "write",
    spec: {
      type: "function",
      function: {
        name: "update_kanban_task",
        description:
          "Modifica una tarea existente (búscala por su título): cambia título, descripción, responsable, prioridad o fecha límite. Solo se cambian los campos que indiques.",
        parameters: {
          type: "object",
          properties: {
            task: { type: "string", description: "Título actual de la tarea." },
            title: { type: "string", description: "Nuevo título (opcional)." },
            description: {
              type: "string",
              description: "Nueva descripción (opcional).",
            },
            assignee: {
              type: "string",
              description:
                "Nuevo responsable, o 'ninguno' para quitarlo (opcional).",
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Nueva prioridad (opcional).",
            },
            due_date: {
              type: "string",
              description:
                "Nueva fecha límite AAAA-MM-DD, o 'ninguna' para quitarla (opcional).",
            },
          },
          required: ["task"],
        },
      },
    },
    async run(args, ctx) {
      const found = await resolveCard(str(args, "task"));
      if (!found.ok) return found.message;

      const patch: Record<string, unknown> = {};
      const changes: string[] = [];

      const newTitle = str(args, "title");
      if (newTitle) {
        patch.title = newTitle;
        changes.push(`título → "${newTitle}"`);
      }
      if (typeof args.description === "string") {
        patch.description = str(args, "description") || null;
        changes.push("descripción actualizada");
      }
      const assigneeArg = str(args, "assignee");
      if (assigneeArg) {
        if (/^(ninguno|nadie|sin asignar|none)$/i.test(assigneeArg)) {
          patch.assignee_id = null;
          changes.push("sin responsable");
        } else {
          const member = await resolveMember(assigneeArg, ctx.orgId);
          if (!member) return `No se encontró al empleado "${assigneeArg}".`;
          patch.assignee_id = member.id;
          changes.push(`responsable → ${member.name}`);
        }
      }
      const priority = str(args, "priority");
      if (priority && isKanbanPriority(priority)) {
        patch.priority = priority;
        changes.push(`prioridad → ${priority}`);
      }
      const dueDate = str(args, "due_date");
      if (dueDate) {
        if (/^(ninguna|sin fecha|none)$/i.test(dueDate)) {
          patch.due_date = null;
          changes.push("sin fecha límite");
        } else {
          patch.due_date = dueDate;
          changes.push(`fecha límite → ${dueDate}`);
        }
      }

      if (Object.keys(patch).length === 0) {
        return "No indicaste ningún cambio para esa tarea.";
      }

      const admin = createAdminClient();
      let { error } = await admin
        .from("kanban_cards")
        .update(patch)
        .eq("id", found.id)
        .eq("organization_id", ctx.orgId);
      if (error) {
        // Retry without the fields that need the newer migration.
        const { priority: _p, due_date: _d, ...legacy } = patch;
        if (Object.keys(legacy).length === 0) {
          return "Error: esta base de datos aún no admite prioridad ni fecha límite.";
        }
        ({ error } = await admin
          .from("kanban_cards")
          .update(legacy)
          .eq("id", found.id)
          .eq("organization_id", ctx.orgId));
      }
      if (error) return "Error: no se pudo actualizar la tarea.";

      return `Tarea "${found.title}" actualizada: ${changes.join(", ")}.`;
    },
  },

  move_kanban_task: {
    risk: "write",
    spec: {
      type: "function",
      function: {
        name: "move_kanban_task",
        description: "Mueve una tarea a otra columna del tablero.",
        parameters: {
          type: "object",
          properties: {
            task: { type: "string", description: "Título de la tarea." },
            column: { type: "string", description: "Columna destino." },
          },
          required: ["task", "column"],
        },
      },
    },
    async run(args, ctx) {
      const found = await resolveCard(str(args, "task"));
      if (!found.ok) return found.message;
      const board = await boardColumns(ctx.orgId);
      if (!board) return "Error: no hay tablero.";
      const target = pickColumn(board.columns, str(args, "column"));
      if (!target) return `No se encontró la columna "${str(args, "column")}".`;

      const admin = createAdminClient();
      const { count } = await admin
        .from("kanban_cards")
        .select("id", { count: "exact", head: true })
        .eq("column_id", target.id);
      const { error } = await admin
        .from("kanban_cards")
        .update({ column_id: target.id, position: count ?? 0 })
        .eq("id", found.id)
        .eq("organization_id", ctx.orgId);
      if (error) return "Error: no se pudo mover la tarea.";
      return `Tarea "${found.title}" movida a "${target.name}".`;
    },
  },

  create_kanban_column: {
    risk: "write",
    spec: {
      type: "function",
      function: {
        name: "create_kanban_column",
        description: "Crea una columna nueva en el tablero Kanban.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nombre de la columna." },
          },
          required: ["name"],
        },
      },
    },
    async run(args, ctx) {
      const name = str(args, "name");
      if (!name) return "Error: la columna necesita un nombre.";
      const board = await boardColumns(ctx.orgId);
      if (!board) return "Error: abre el Kanban primero para crear el tablero.";
      const admin = createAdminClient();
      const { error } = await admin.from("kanban_columns").insert({
        board_id: board.boardId,
        organization_id: ctx.orgId,
        name,
        position: board.columns.length,
      });
      if (error) return "Error: no se pudo crear la columna.";
      return `Columna "${name}" creada.`;
    },
  },

  register_visit: {
    risk: "write",
    permission: Permission.RegisterVisit,
    spec: {
      type: "function",
      function: {
        name: "register_visit",
        description:
          "Registra un lavado pagado para un cliente (por nombre o placa) y suma su progreso.",
        parameters: {
          type: "object",
          properties: {
            customer: { type: "string", description: "Nombre o placa." },
          },
          required: ["customer"],
        },
      },
    },
    async run(args) {
      const found = await resolveMembership(str(args, "customer"));
      if (!found.ok) return found.message;
      const { registerVisitAction } = await import("@/actions/scan");
      const result = await registerVisitAction(found.id, crypto.randomUUID());
      if (!result.ok)
        return `No se pudo registrar la visita (${result.reason}).`;
      const p = result.view.progress;
      return (
        `Lavado registrado para ${found.label}. Progreso ${p.current}/${p.required}.` +
        (result.rewardEarned ? " ¡Desbloqueó una recompensa!" : "")
      );
    },
  },

  redeem_reward: {
    risk: "write",
    permission: Permission.RedeemReward,
    spec: {
      type: "function",
      function: {
        name: "redeem_reward",
        description: "Canjea una recompensa disponible de un cliente.",
        parameters: {
          type: "object",
          properties: {
            customer: { type: "string", description: "Nombre o placa." },
          },
          required: ["customer"],
        },
      },
    },
    async run(args) {
      const found = await resolveMembership(str(args, "customer"));
      if (!found.ok) return found.message;
      const { redeemRewardAction } = await import("@/actions/scan");
      const result = await redeemRewardAction(found.id, crypto.randomUUID());
      if (!result.ok) return `No se pudo canjear (${result.reason}).`;
      return `Recompensa canjeada para ${found.label}.`;
    },
  },

  set_membership_status: {
    risk: "write",
    permission: Permission.BlockMembership,
    spec: {
      type: "function",
      function: {
        name: "set_membership_status",
        description:
          "Bloquea o reactiva la tarjeta de un cliente. Bloquear impide registrar visitas y canjes.",
        parameters: {
          type: "object",
          properties: {
            customer: { type: "string", description: "Nombre o placa." },
            status: {
              type: "string",
              enum: ["blocked", "active"],
              description: "Nuevo estado.",
            },
          },
          required: ["customer", "status"],
        },
      },
    },
    async run(args) {
      const status = str(args, "status");
      if (status !== "blocked" && status !== "active") {
        return "Error: el estado debe ser 'blocked' o 'active'.";
      }
      const found = await resolveMembership(str(args, "customer"));
      if (!found.ok) return found.message;
      const { blockAction, reactivateAction } = await import("@/actions/admin");
      const result =
        status === "blocked"
          ? await blockAction(found.id)
          : await reactivateAction(found.id);
      if (!result.ok) return `No se pudo cambiar el estado (${result.reason}).`;
      return `Tarjeta de ${found.label} ${status === "blocked" ? "bloqueada" : "reactivada"}.`;
    },
  },

  update_program: {
    risk: "write",
    permission: Permission.ManageProgram,
    spec: {
      type: "function",
      function: {
        name: "update_program",
        description:
          "Actualiza el programa de fidelización. Consulta get_program primero y reenvía los valores que no cambian.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nombre del programa." },
            paid_visits_required: {
              type: "integer",
              description: "Lavados pagados necesarios para la recompensa.",
            },
            reward_quantity: {
              type: "integer",
              description: "Cantidad de recompensa.",
            },
            reward_name: {
              type: "string",
              description: "Nombre de la recompensa.",
            },
          },
          required: [
            "name",
            "paid_visits_required",
            "reward_quantity",
            "reward_name",
          ],
        },
      },
    },
    async run(args) {
      const visits = int(args, "paid_visits_required");
      const quantity = int(args, "reward_quantity");
      if (visits === null || quantity === null) {
        return "Error: las visitas y la cantidad deben ser números enteros.";
      }
      const { updateProgram } = await import("@/actions/org");
      const result = await updateProgram({
        name: str(args, "name"),
        paidVisitsRequired: visits,
        rewardQuantity: quantity,
        rewardName: str(args, "reward_name"),
      });
      if (!result.ok)
        return `No se pudo actualizar el programa: ${result.message}`;
      return `Programa actualizado: ${visits} lavados → ${quantity} x ${str(args, "reward_name")}.`;
    },
  },

  invite_member: {
    risk: "write",
    permission: Permission.InviteMembers,
    spec: {
      type: "function",
      function: {
        name: "invite_member",
        description:
          "Invita a una persona al equipo como encargado o empleado.",
        parameters: {
          type: "object",
          properties: {
            email: { type: "string", description: "Correo de la persona." },
            full_name: { type: "string", description: "Nombre completo." },
            role: {
              type: "string",
              enum: ["manager", "employee"],
              description: "Rol a asignar.",
            },
          },
          required: ["email", "full_name", "role"],
        },
      },
    },
    async run(args) {
      const role = str(args, "role");
      if (role !== "manager" && role !== "employee") {
        return "Error: el rol debe ser 'manager' o 'employee'.";
      }
      const { inviteMember } = await import("@/actions/team");
      const result = await inviteMember({
        email: str(args, "email"),
        fullName: str(args, "full_name"),
        role,
      });
      if (!result.ok) return `No se pudo invitar: ${result.message}`;
      return `Invitación enviada a ${str(args, "full_name")} (${str(args, "email")}) como ${role}.`;
    },
  },

  create_branch: {
    risk: "write",
    permission: Permission.ManageBranches,
    spec: {
      type: "function",
      function: {
        name: "create_branch",
        description: "Crea una sucursal nueva.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nombre de la sucursal." },
            code: {
              type: "string",
              description: "Código corto e irrepetible.",
            },
          },
          required: ["name", "code"],
        },
      },
    },
    async run(args) {
      const { createBranch } = await import("@/actions/org");
      const result = await createBranch({
        name: str(args, "name"),
        code: str(args, "code"),
      });
      if (!result.ok) return `No se pudo crear la sucursal: ${result.message}`;
      return `Sucursal "${str(args, "name")}" creada.`;
    },
  },

  // ---------------------------------------------------------- destructive ---
  delete_kanban_task: {
    risk: "destructive",
    spec: {
      type: "function",
      function: {
        name: "delete_kanban_task",
        description:
          "Elimina una tarea del tablero. Requiere que el usuario lo confirme antes de ejecutarse.",
        parameters: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Título de la tarea a eliminar.",
            },
          },
          required: ["task"],
        },
      },
    },
    async describe(args) {
      const found = await resolveCard(str(args, "task"));
      if (!found.ok) return null;
      return `Eliminar la tarea "${found.title}" de la columna "${found.columnName}".`;
    },
    async run(args, ctx) {
      const found = await resolveCard(str(args, "task"));
      if (!found.ok) return found.message;
      const admin = createAdminClient();
      const { error } = await admin
        .from("kanban_cards")
        .delete()
        .eq("id", found.id)
        .eq("organization_id", ctx.orgId);
      if (error) return "Error: no se pudo eliminar la tarea.";
      return `Tarea "${found.title}" eliminada.`;
    },
  },

  delete_kanban_column: {
    risk: "destructive",
    spec: {
      type: "function",
      function: {
        name: "delete_kanban_column",
        description:
          "Elimina una columna del tablero Y todas sus tareas. Requiere confirmación del usuario.",
        parameters: {
          type: "object",
          properties: {
            column: { type: "string", description: "Nombre de la columna." },
          },
          required: ["column"],
        },
      },
    },
    async describe(args) {
      const board = await getBoard();
      if (!board) return null;
      const target = pickColumn(board.columns, str(args, "column"));
      if (!target) return null;
      return (
        `Eliminar la columna "${target.name}"` +
        (target.cards.length
          ? ` y sus ${target.cards.length} tarea(s): ${target.cards.map((c) => `"${c.title}"`).join(", ")}.`
          : " (está vacía).")
      );
    },
    async run(args, ctx) {
      const board = await getBoard();
      if (!board) return "Error: no hay tablero.";
      const target = pickColumn(board.columns, str(args, "column"));
      if (!target) return `No se encontró la columna "${str(args, "column")}".`;
      const admin = createAdminClient();
      const { error } = await admin
        .from("kanban_columns")
        .delete()
        .eq("id", target.id)
        .eq("organization_id", ctx.orgId);
      if (error) return "Error: no se pudo eliminar la columna.";
      return `Columna "${target.name}" eliminada.`;
    },
  },

  archive_customer: {
    risk: "destructive",
    permission: Permission.BlockMembership,
    spec: {
      type: "function",
      function: {
        name: "archive_customer",
        description:
          "Archiva a un cliente: deja de aparecer en listados y reportes. Requiere confirmación.",
        parameters: {
          type: "object",
          properties: {
            customer: { type: "string", description: "Nombre o placa." },
          },
          required: ["customer"],
        },
      },
    },
    async describe(args) {
      const found = await resolveMembership(str(args, "customer"));
      if (!found.ok) return null;
      return `Archivar al cliente ${found.label}. Dejará de aparecer en listados y reportes.`;
    },
    async run(args) {
      const found = await resolveMembership(str(args, "customer"));
      if (!found.ok) return found.message;
      const { archiveCustomerAction } = await import("@/actions/admin");
      const result = await archiveCustomerAction(found.id);
      if (!result.ok) return `No se pudo archivar (${result.reason}).`;
      return `Cliente ${found.label} archivado.`;
    },
  },

  reverse_visit: {
    risk: "destructive",
    permission: Permission.ReverseMovement,
    spec: {
      type: "function",
      function: {
        name: "reverse_visit",
        description:
          "Reversa el último movimiento de un cliente (visita registrada por error). Requiere confirmación.",
        parameters: {
          type: "object",
          properties: {
            customer: { type: "string", description: "Nombre o placa." },
            reason: { type: "string", description: "Motivo de la reversión." },
          },
          required: ["customer", "reason"],
        },
      },
    },
    async describe(args) {
      const found = await resolveMembership(str(args, "customer"));
      if (!found.ok) return null;
      const reason = str(args, "reason");
      if (!reason) return null;
      return `Reversar el último movimiento de ${found.label}. Motivo: "${reason}".`;
    },
    async run(args) {
      const reason = str(args, "reason");
      if (!reason) return "Error: la reversión necesita un motivo.";
      const found = await resolveMembership(str(args, "customer"));
      if (!found.ok) return found.message;
      const { reverseVisitAction } = await import("@/actions/admin");
      const result = await reverseVisitAction(found.id, reason);
      if (!result.ok) return `No se pudo reversar (${result.reason}).`;
      return `Movimiento de ${found.label} reversado.`;
    },
  },

  deactivate_member: {
    risk: "destructive",
    permission: Permission.InviteMembers,
    spec: {
      type: "function",
      function: {
        name: "deactivate_member",
        description:
          "Desactiva a un miembro del equipo: pierde el acceso a la app. Requiere confirmación.",
        parameters: {
          type: "object",
          properties: {
            member: { type: "string", description: "Nombre del miembro." },
          },
          required: ["member"],
        },
      },
    },
    async describe(args, ctx) {
      const member = await resolveMember(str(args, "member"), ctx.orgId);
      if (!member) return null;
      if (member.id === ctx.userId) return null;
      return `Desactivar a ${member.name}. Perderá el acceso a la aplicación.`;
    },
    async run(args, ctx) {
      const member = await resolveMember(str(args, "member"), ctx.orgId);
      if (!member) return `No se encontró al miembro "${str(args, "member")}".`;
      if (member.id === ctx.userId) {
        return "No puedes desactivar tu propia cuenta desde aquí.";
      }
      const { setMemberStatus } = await import("@/actions/team");
      const result = await setMemberStatus(member.id, "disabled");
      if (!result.ok) return `No se pudo desactivar: ${result.message}`;
      return `${member.name} fue desactivado.`;
    },
  },
};

// --- public surface ---------------------------------------------------------

/** Tool specs the caller's role is actually allowed to use. */
export function toolSpecsFor(role: MemberRole): ToolSpec[] {
  return Object.values(CAPABILITIES)
    .filter((c) => !c.permission || can(role, c.permission))
    .map((c) => c.spec);
}

export interface ToolRunResult {
  result: string;
  didWrite: boolean;
  /** Set when the capability needs the user to approve before it runs. */
  pending?: { tool: string; args: Record<string, unknown>; summary: string };
}

function parseArgs(argsJson: string): Args {
  try {
    const parsed: unknown = JSON.parse(argsJson);
    if (parsed && typeof parsed === "object") return parsed as Args;
  } catch {
    /* malformed args from the model — treat as empty */
  }
  return {};
}

async function context(): Promise<ToolContext | null> {
  const membership = await getActiveMembership();
  if (!membership) return null;
  const { getCurrentUser } = await import("@/lib/supabase/auth");
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    orgId: membership.organizationId,
    role: toMemberRole(membership.role),
    userId: user.id,
  };
}

/**
 * Run a tool the model asked for. Destructive capabilities stop here and return
 * a `pending` description instead of executing.
 */
export async function runTool(
  name: string,
  argsJson: string,
): Promise<ToolRunResult> {
  const capability = CAPABILITIES[name];
  if (!capability) {
    return { result: `Herramienta desconocida: ${name}`, didWrite: false };
  }

  const ctx = await context();
  if (!ctx) return { result: "Error: sesión no válida.", didWrite: false };

  if (capability.permission && !can(ctx.role, capability.permission)) {
    return {
      result:
        "Permiso denegado: el rol del usuario no autoriza esta acción. Explícaselo sin reintentar.",
      didWrite: false,
    };
  }

  const args = parseArgs(argsJson);

  if (capability.risk === "destructive") {
    const summary = capability.describe
      ? await capability.describe(args, ctx)
      : null;
    if (!summary) {
      return {
        result:
          "No se pudo identificar el objetivo de esa acción. Pide al usuario que lo precise.",
        didWrite: false,
      };
    }
    return {
      result: `Acción pendiente de confirmación del usuario: ${summary}`,
      didWrite: false,
      pending: { tool: name, args, summary },
    };
  }

  const result = await capability.run(args, ctx);
  return { result, didWrite: capability.risk === "write" };
}

/**
 * Execute a capability the user approved. Re-checks permission and re-resolves
 * the target — the ticket carries intent, never authority.
 */
export async function runConfirmedTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const capability = CAPABILITIES[name];
  if (!capability || capability.risk !== "destructive") {
    return { ok: false, message: "Acción no válida." };
  }
  const ctx = await context();
  if (!ctx) return { ok: false, message: "Sesión no válida." };
  if (capability.permission && !can(ctx.role, capability.permission)) {
    return { ok: false, message: "No tienes permiso para esta acción." };
  }
  const message = await capability.run(args, ctx);
  return { ok: !message.startsWith("Error"), message };
}
