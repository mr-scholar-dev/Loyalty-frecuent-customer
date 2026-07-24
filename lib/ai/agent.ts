import "server-only";
import {
  completeWithTools,
  type RawMessage,
  type RawToolCall,
} from "./openrouter";
import { runTool, TOOL_SPECS } from "./tools";

/**
 * Tool-using agent loop. The model may call tools (read business data, manage
 * the Kanban board); we execute them server-side and feed results back until it
 * produces a final answer. Bounded by MAX_STEPS to avoid runaway loops.
 */

const MAX_STEPS = 5;

export interface AgentResult {
  text: string;
  /** True if any tool mutated data (e.g. created a Kanban task). */
  didWrite: boolean;
}

export async function runAgent(
  system: string,
  userMessage: string,
): Promise<AgentResult> {
  const messages: RawMessage[] = [
    { role: "system", content: system },
    { role: "user", content: userMessage },
  ];
  let didWrite = false;

  for (let step = 0; step < MAX_STEPS; step++) {
    const msg = await completeWithTools(messages, TOOL_SPECS);

    if (msg.toolCalls.length === 0) {
      return { text: msg.content ?? "", didWrite };
    }

    const toolCalls: RawToolCall[] = msg.toolCalls.map((tc) => ({
      id: tc.id,
      type: "function",
      function: { name: tc.name, arguments: tc.arguments },
    }));
    messages.push({
      role: "assistant",
      content: msg.content ?? "",
      tool_calls: toolCalls,
    });

    for (const tc of msg.toolCalls) {
      const r = await runTool(tc.name, tc.arguments);
      if (r.didWrite) didWrite = true;
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: r.result,
      });
    }
  }

  // Ran out of steps — ask for a final answer with no more tools.
  const final = await completeWithTools(messages, []);
  return {
    text: final.content ?? "Listo, he realizado las acciones solicitadas.",
    didWrite,
  };
}
