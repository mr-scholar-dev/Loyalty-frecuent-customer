import "server-only";

/**
 * OpenRouter client — SERVER ONLY. OpenRouter exposes an OpenAI-compatible
 * Chat Completions API, so the model is configurable (Claude, GPT, Llama…)
 * via OPENROUTER_MODEL without code changes, including tool/function calling.
 *
 * Degrades gracefully: `isAIConfigured()` is false until OPENROUTER_API_KEY is
 * set, so the IA section shows a "no configurada" state instead of erroring.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.6-flash";

export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function getAIModel(): string {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}

export class AINotConfiguredError extends Error {
  constructor() {
    super("IA no configurada");
    this.name = "AINotConfiguredError";
  }
}

// --- message + tool types (OpenAI-compatible) -------------------------------
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface RawToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type RawMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: RawToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface ToolSpec {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}
export interface AssistantMessage {
  content: string | null;
  toolCalls: ToolCall[];
}

// --- response parsing (no `any`) --------------------------------------------
function getMessage(data: unknown): Record<string, unknown> | null {
  if (typeof data !== "object" || data === null) return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (typeof first !== "object" || first === null) return null;
  const message = (first as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;
  return message as Record<string, unknown>;
}

function parseAssistant(data: unknown): AssistantMessage {
  const msg = getMessage(data);
  const content = typeof msg?.content === "string" ? msg.content : null;
  const rawCalls = Array.isArray(msg?.tool_calls) ? msg.tool_calls : [];
  const toolCalls: ToolCall[] = [];
  for (const c of rawCalls) {
    if (typeof c !== "object" || c === null) continue;
    const id = (c as { id?: unknown }).id;
    const fn = (c as { function?: unknown }).function;
    if (typeof id !== "string" || typeof fn !== "object" || fn === null)
      continue;
    const name = (fn as { name?: unknown }).name;
    const args = (fn as { arguments?: unknown }).arguments;
    if (typeof name !== "string") continue;
    toolCalls.push({
      id,
      name,
      arguments: typeof args === "string" ? args : "{}",
    });
  }
  return { content, toolCalls };
}

async function callOpenRouter(body: Record<string, unknown>): Promise<unknown> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new AINotConfiguredError();

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3200",
      "X-Title": "Loyalty Web",
    },
    body: JSON.stringify({ model: getAIModel(), ...body }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json();
}

/** Plain text completion (no tools) — used for summaries and drafts. */
export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const data = await callOpenRouter({
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 800,
  });
  const { content } = parseAssistant(data);
  if (!content) throw new Error("La IA no devolvió una respuesta válida.");
  return content.trim();
}

/** Completion that may return tool calls — used by the agent loop. */
export async function completeWithTools(
  messages: RawMessage[],
  tools: ToolSpec[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<AssistantMessage> {
  const body: Record<string, unknown> = {
    messages,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 900,
  };
  if (tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }
  return parseAssistant(await callOpenRouter(body));
}
