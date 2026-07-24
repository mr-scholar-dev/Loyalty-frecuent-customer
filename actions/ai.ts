"use server";

import { chat, isAIConfigured } from "@/lib/ai/openrouter";
import { runAgent } from "@/lib/ai/agent";
import { getBusinessContext } from "@/lib/ai/insights";
import { getMembershipDetail } from "@/lib/loyalty/admin-queries";
import { getActiveMembership } from "@/lib/supabase/auth";

/**
 * AI server actions. Everything runs server-side: the OpenRouter key never
 * reaches the client, and all business data is read under RLS (own org only).
 */

export type AIResult =
  | { ok: true; text: string }
  | { ok: false; message: string };

const ADVISOR_SYSTEM =
  "Eres un asesor de negocios para un servicentro / autolavado en Costa Rica. " +
  "Respondes SIEMPRE en español, de forma clara, concreta y accionable. " +
  "Usa ÚNICAMENTE los datos proporcionados; si falta información, dilo con honestidad " +
  "en lugar de inventar cifras. Sé breve: usa viñetas cuando ayude y evita relleno.";

const AGENT_SYSTEM =
  "Eres el copiloto de Loyalty Web, la plataforma de fidelización de un " +
  "servicentro / autolavado en Costa Rica. Conoces y operas toda la app: " +
  "puedes CONSULTAR el negocio (métricas, clientes, clientes en riesgo) y " +
  "GESTIONAR el tablero Kanban (crear tareas y asignarlas a empleados) usando " +
  "las herramientas disponibles. Usa herramientas siempre que necesites datos " +
  "reales o para ejecutar una acción; nunca inventes datos. Cuando ejecutes una " +
  "acción (p. ej. crear una tarea), confírmalo explícitamente. Si se te indica " +
  "en qué pantalla está el usuario, tenlo en cuenta para ofrecer ayuda relevante " +
  "a esa sección. Responde SIEMPRE en español, breve y accionable.";

function notConfigured(): AIResult {
  return {
    ok: false,
    message:
      "IA no configurada. Agrega OPENROUTER_API_KEY en el servidor para activarla.",
  };
}

async function requireOrg(): Promise<string | null> {
  return (await getActiveMembership())?.organizationId ?? null;
}

/** Agentic assistant: knows the whole app and can act (e.g. create Kanban
 * tasks) via tools. `pageContext` describes the screen the user is on. */
export async function askAssistant(
  question: string,
  pageContext?: string,
): Promise<AIResult> {
  if (!(await requireOrg())) return { ok: false, message: "Sesión no válida." };
  if (!isAIConfigured()) return notConfigured();
  const q = question.trim();
  if (!q) return { ok: false, message: "Escribe una pregunta." };

  const userMessage = pageContext
    ? `El usuario está en la pantalla: ${pageContext}.\n\n${q}`
    : q;

  try {
    const { text } = await runAgent(AGENT_SYSTEM, userMessage);
    // NOTE: intentionally NOT calling revalidatePath here. Revalidating the
    // current route re-renders its server components inside this action, which
    // triggers another getUser() ~15s in and was implicated in the session
    // loss. The client refreshes the view itself after the response instead.
    return { ok: true, text };
  } catch {
    return { ok: false, message: "No se pudo consultar la IA. Intenta de nuevo." };
  }
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
    return { ok: false, message: "No se pudo generar el resumen. Intenta de nuevo." };
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
    return { ok: false, message: "No se pudo generar el mensaje. Intenta de nuevo." };
  }
}
