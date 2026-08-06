import "server-only";
import {
  completeWithTools,
  type RawMessage,
  type RawToolCall,
} from "./openrouter";
import { runTool, toolSpecsFor } from "./tools";
import type { MemberRole } from "@/types/domain";

/**
 * Tool-using agent loop. The model may call capabilities (read business data,
 * manage the board, act on customers); we execute them server-side and feed the
 * results back until it produces a final answer.
 *
 * Two bounds keep a turn finite: MAX_STEPS on tool rounds, and an immediate
 * stop as soon as a capability asks for human confirmation — nothing after a
 * pending approval would be meaningful until the user answers.
 */

const MAX_STEPS = 6;

export interface PendingApproval {
  tool: string;
  args: Record<string, unknown>;
  summary: string;
}

export interface AgentTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResult {
  text: string;
  /** True if any capability mutated data. */
  didWrite: boolean;
  /** Set when the agent needs the user to approve a destructive action. */
  pending?: PendingApproval;
}

export async function runAgent(
  system: string,
  userMessage: string,
  opts: { role: MemberRole; history?: AgentTurn[] } = {
    role: "employee" as MemberRole,
  },
): Promise<AgentResult> {
  const tools = toolSpecsFor(opts.role);
  const messages: RawMessage[] = [
    { role: "system", content: system },
    // Prior turns give the agent continuity ("y esa tarea pásala a Hecho"),
    // which is most of what makes it feel like an assistant rather than a
    // one-shot query box.
    ...(opts.history ?? []).map((t): RawMessage => ({
      role: t.role,
      content: t.content,
    })),
    { role: "user", content: userMessage },
  ];
  let didWrite = false;

  for (let step = 0; step < MAX_STEPS; step++) {
    const msg = await completeWithTools(messages, tools);

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

    let pending: PendingApproval | undefined;
    for (const tc of msg.toolCalls) {
      const r = await runTool(tc.name, tc.arguments);
      if (r.didWrite) didWrite = true;
      if (r.pending && !pending) pending = r.pending;
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: r.result,
      });
    }

    if (pending) {
      // Let the model phrase the request for approval, but with no further
      // tools — it must not keep acting while an action awaits a decision.
      const ask = await completeWithTools(messages, []);
      return {
        text: ask.content?.trim() || `Voy a ${pending.summary} ¿Lo confirmas?`,
        didWrite,
        pending,
      };
    }
  }

  // Ran out of steps — ask for a final answer with no more tools.
  const final = await completeWithTools(messages, []);
  return {
    text: final.content ?? "Listo, he realizado las acciones solicitadas.",
    didWrite,
  };
}
