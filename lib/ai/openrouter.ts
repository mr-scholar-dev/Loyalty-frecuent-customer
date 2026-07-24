import "server-only";

/**
 * OpenRouter client — SERVER ONLY. OpenRouter exposes an OpenAI-compatible
 * Chat Completions API, so the model is configurable (Claude, GPT, Llama…)
 * via OPENROUTER_MODEL without code changes.
 *
 * Degrades gracefully: `isAIConfigured()` is false until OPENROUTER_API_KEY is
 * set, so the IA section shows a "no configurada" state instead of erroring.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

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

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Narrow the OpenAI-compatible response shape without using `any`. */
function extractContent(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (typeof first !== "object" || first === null) return null;
  const message = (first as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : null;
}

export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new AINotConfiguredError();

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      // Optional attribution headers recommended by OpenRouter.
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3200",
      "X-Title": "Loyalty Web",
    },
    body: JSON.stringify({
      model: getAIModel(),
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 800,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 200)}`);
  }

  const content = extractContent(await res.json());
  if (!content) throw new Error("La IA no devolvió una respuesta válida.");
  return content.trim();
}
