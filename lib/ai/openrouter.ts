import "server-only";

/**
 * LLM client — SERVER ONLY. Talks to an OpenAI-compatible Chat Completions API
 * (tool/function calling included). Supports two providers, selected by env:
 *   - Cerebras direct (CEREBRAS_API_KEY) — fast, takes precedence.
 *   - OpenRouter (OPENROUTER_API_KEY) — multi-provider fallback.
 *
 * Degrades gracefully: `isAIConfigured()` is false until a key is set, so the
 * IA section shows a "no configurada" state instead of erroring.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";

interface Provider {
  url: string;
  key: string;
  defaultModel: string;
  isOpenRouter: boolean;
}

/** Cerebras (direct) takes precedence; OpenRouter is the multi-provider fallback. */
function getProvider(): Provider | null {
  const cerebras = process.env.CEREBRAS_API_KEY;
  if (cerebras) {
    return {
      url: CEREBRAS_URL,
      key: cerebras,
      defaultModel: "gpt-oss-120b",
      isOpenRouter: false,
    };
  }
  const openrouter = process.env.OPENROUTER_API_KEY;
  if (openrouter) {
    return {
      url: OPENROUTER_URL,
      key: openrouter,
      defaultModel: "openai/gpt-oss-120b",
      isOpenRouter: true,
    };
  }
  return null;
}

export function isAIConfigured(): boolean {
  return getProvider() !== null;
}

export function getAIModel(): string {
  return (
    process.env.AI_MODEL ||
    process.env.OPENROUTER_MODEL ||
    getProvider()?.defaultModel ||
    "gpt-oss-120b"
  );
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

/** Optional provider routing for OpenRouter (e.g. force Cerebras for speed).
 * Comma-separated provider names in OPENROUTER_PROVIDER, ranked by preference. */
function providerRouting(): Record<string, unknown> | undefined {
  const raw = process.env.OPENROUTER_PROVIDER;
  if (!raw) return undefined;
  const order = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (order.length === 0) return undefined;
  return { order, allow_fallbacks: true };
}

async function callLLM(body: Record<string, unknown>): Promise<unknown> {
  const provider = getProvider();
  if (!provider) throw new AINotConfiguredError();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.key}`,
    "Content-Type": "application/json",
  };
  const extra: Record<string, unknown> = {};
  if (provider.isOpenRouter) {
    headers["HTTP-Referer"] =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3200";
    headers["X-Title"] = "Loyalty Web";
    const routing = providerRouting();
    if (routing) extra.provider = routing;
  }

  const res = await fetch(provider.url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: getAIModel(), ...extra, ...body }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json();
}

/** Plain text completion (no tools) — used for summaries and drafts. */
export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const data = await callLLM({
    messages,
    temperature: opts.temperature ?? 0.4,
    // Headroom for reasoning models (e.g. gpt-oss) that spend tokens thinking
    // before emitting content.
    max_tokens: opts.maxTokens ?? 1500,
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
    // Headroom for reasoning tokens + the answer / tool call.
    max_tokens: opts.maxTokens ?? 1800,
  };
  if (tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }
  return parseAssistant(await callLLM(body));
}
