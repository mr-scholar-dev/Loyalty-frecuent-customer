"use server";

import { chat, isAIConfigured } from "@/lib/ai/openrouter";
import { runAgent, type AgentTurn } from "@/lib/ai/agent";
import { getBusinessContext } from "@/lib/ai/insights";
import { runConfirmedTool } from "@/lib/ai/tools";
import { issueTicket, verifyTicket } from "@/lib/ai/pending";
import { getMembershipDetail } from "@/lib/loyalty/admin-queries";
import { toMemberRole } from "@/lib/permissions/roles";
import {
  getActiveMembership,
  getCurrentUser,
  hasPaidAccess,
} from "@/lib/supabase/auth";

/**
 * AI server actions. Everything runs server-side: the OpenRouter key never
 * reaches the client, and all business data is read under RLS (own org only).
 */

export type AIResult =
  { ok: true; text: string } | { ok: false; message: string };

/** A destructive action the agent proposed, awaiting the user's approval. */
export interface PendingApprovalView {
  summary: string;
  /** Signed ticket; the only way to actually run the action. */
  ticket: string;
}

export type AssistantResult =
  | { ok: true; text: string; pending?: PendingApprovalView }
  | { ok: false; message: string };

const ADVISOR_SYSTEM =
  "Eres un asesor de negocios para un servicentro / autolavado en Costa Rica. " +
  "Respondes SIEMPRE en español, de forma clara, concreta y accionable. " +
  "Usa ÚNICAMENTE los datos proporcionados; si falta información, dilo con honestidad " +
  "en lugar de inventar cifras. Sé breve: usa viñetas cuando ayude y evita relleno.";

const AGENT_SYSTEM = [
  "Eres el copiloto de Loyalty Web, la plataforma de fidelización de un",
  "servicentro / autolavado en Costa Rica. Operas la app de verdad mediante las",
  "herramientas disponibles: consultas el negocio (métricas, clientes, equipo,",
  "programa, auditoría) y ejecutas acciones (tablero Kanban, visitas, canjes,",
  "estado de tarjetas, programa, equipo y sucursales).",
  "",
  "Reglas:",
  "- Usa herramientas siempre que necesites datos reales o para actuar. Nunca",
  "  inventes cifras, nombres ni resultados.",
  "- Antes de modificar algo, asegúrate de identificar bien el objetivo. Si una",
  "  búsqueda devuelve varias coincidencias, pregunta cuál en vez de adivinar.",
  "- Las acciones destructivas (eliminar, archivar, reversar, desactivar) no se",
  "  ejecutan al invocarlas: el usuario debe confirmarlas. Cuando una quede",
  "  pendiente, explica en una frase exactamente qué pasará y pide confirmación.",
  "- Si una herramienta responde que no hay permiso, explícalo con claridad y no",
  "  lo reintentes por otra vía.",
  "- Solo ves las herramientas que el rol del usuario permite; no prometas",
  "  acciones que no puedes ejecutar.",
  "- Al terminar una acción, confirma en concreto qué cambió.",
  "- Si se te indica en qué pantalla está el usuario, aprovéchalo para dar ayuda",
  "  relevante a esa sección.",
  "",
  "Responde SIEMPRE en español, breve y accionable.",
].join("\n");

function notConfigured(): AIResult {
  return {
    ok: false,
    message:
      "IA no configurada. Agrega OPENROUTER_API_KEY en el servidor para activarla.",
  };
}

async function requireOrg(): Promise<string | null> {
  // Payment gate: the AI copilot is a paid feature.
  if (!(await hasPaidAccess())) return null;
  return (await getActiveMembership())?.organizationId ?? null;
}

/** How many prior turns travel back to the model. Enough for follow-ups like
 * "ahora muévela a Hecho" without unbounded prompt growth. */
const HISTORY_LIMIT = 10;

/**
 * Agentic assistant: knows the whole app and acts through tools, limited to
 * what the caller's role permits. `pageContext` describes the screen the user
 * is on; `history` carries the conversation so far.
 */
export async function askAssistant(
  question: string,
  pageContext?: string,
  history: AgentTurn[] = [],
): Promise<AssistantResult> {
  const membership = await getActiveMembership();
  if (!membership || !(await hasPaidAccess())) {
    return { ok: false, message: "Sesión no válida." };
  }
  if (!isAIConfigured()) return notConfigured();
  const q = question.trim();
  if (!q) return { ok: false, message: "Escribe una pregunta." };

  const userMessage = pageContext
    ? `El usuario está en la pantalla: ${pageContext}.\n\n${q}`
    : q;

  try {
    const { text, pending } = await runAgent(AGENT_SYSTEM, userMessage, {
      role: toMemberRole(membership.role),
      history: history.slice(-HISTORY_LIMIT),
    });

    // NOTE: intentionally NOT calling revalidatePath here. Revalidating the
    // current route re-renders its server components inside this action, which
    // triggers another getUser() ~15s in and was implicated in the session
    // loss. The client refreshes the view itself after the response instead.

    if (!pending) return { ok: true, text };

    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Sesión no válida." };
    return {
      ok: true,
      text,
      pending: {
        summary: pending.summary,
        ticket: issueTicket(
          { tool: pending.tool, args: pending.args, summary: pending.summary },
          user.id,
          membership.organizationId,
        ),
      },
    };
  } catch {
    return {
      ok: false,
      message: "No se pudo consultar la IA. Intenta de nuevo.",
    };
  }
}

/**
 * Execute a destructive action the user approved in the chat. The ticket is
 * signed and bound to this user and organization; authority is re-checked here,
 * never inherited from the ticket.
 */
export async function confirmAssistantAction(
  ticket: string,
): Promise<AIResult> {
  const [membership, user] = await Promise.all([
    getActiveMembership(),
    getCurrentUser(),
  ]);
  if (!membership || !user || !(await hasPaidAccess())) {
    return { ok: false, message: "Sesión no válida." };
  }

  const action = verifyTicket(ticket, user.id, membership.organizationId);
  if (!action) {
    return {
      ok: false,
      message: "La confirmación expiró o no es válida. Pídelo de nuevo.",
    };
  }

  const result = await runConfirmedTool(action.tool, action.args);
  return result.ok
    ? { ok: true, text: result.message }
    : { ok: false, message: result.message };
}

/** Narrative summary of the current month plus 2-3 concrete suggestions. */
export async function generateSummary(): Promise<AIResult> {
  if (!(await requireOrg())) return { ok: false, message: "Sesión no válida." };
  if (!isAIConfigured()) return notConfigured();

  try {
    const context = await getBusinessContext(new Date().toISOString());
    const text = await chat([
      { role: "system", content: ADVISOR_SYSTEM },
      {
        role: "user",
        content:
          `${context}\n\nRedacta un resumen breve del desempeño del mes ` +
          "(2-3 frases) y luego 2 o 3 acciones concretas para vender más lavados " +
          "y retener clientes. Usa viñetas para las acciones.",
      },
    ]);
    return { ok: true, text };
  } catch {
    return {
      ok: false,
      message: "No se pudo generar el resumen. Intenta de nuevo.",
    };
  }
}

/** Drafts a warm WhatsApp reactivation message for a specific customer. */
export async function draftReactivationMessage(
  membershipId: string,
): Promise<AIResult> {
  const membership = await getActiveMembership();
  if (!membership) return { ok: false, message: "Sesión no válida." };
  if (!isAIConfigured()) return notConfigured();

  const detail = await getMembershipDetail(membershipId);
  if (!detail) return { ok: false, message: "Cliente no encontrado." };

  const firstName = detail.customerFullName.split(/\s+/)[0] ?? "cliente";
  const { current, required, remaining } = detail.progress;

  try {
    const text = await chat(
      [
        { role: "system", content: ADVISOR_SYSTEM },
        {
          role: "user",
          content:
            `Escribe un mensaje de WhatsApp corto (2-3 frases), cálido y natural, ` +
            `para reactivar a un cliente que no vuelve al autolavado "${membership.organizationName}". ` +
            `Nombre: ${firstName}. Progreso: ${current} de ${required} lavados ` +
            `(le faltan ${remaining} para su lavado gratis). ` +
            "Invítalo a volver, menciona su progreso como incentivo y NO uses corchetes " +
            "ni marcadores de posición. Devuelve solo el mensaje, listo para enviar.",
        },
      ],
      { temperature: 0.7 },
    );
    return { ok: true, text };
  } catch {
    return {
      ok: false,
      message: "No se pudo generar el mensaje. Intenta de nuevo.",
    };
  }
}
