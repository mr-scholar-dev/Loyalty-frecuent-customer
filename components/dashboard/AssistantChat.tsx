"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { AlertTriangle, Check, Loader2, Send, Sparkles, X } from "lucide-react";
import { askAssistant, confirmAssistantAction } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface PendingApproval {
  summary: string;
  ticket: string;
}

interface AssistantChatProps {
  /** Screen the user is on, so the agent can tailor its help. */
  pageContext?: string;
  suggestions?: readonly string[];
  /** Max height of the transcript area. */
  className?: string;
  placeholder?: string;
}

/**
 * Renders `**bold**` and leaves the rest as-is. Models reach for markdown
 * emphasis constantly; showing raw asterisks makes the answer look broken.
 */
function formatInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** Splits an answer into paragraphs and bullet lists. */
function AnswerBody({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: { type: "p" | "li"; text: string }[] = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      /^([-*•]|\d+\.)\s+/.test(line)
        ? { type: "li" as const, text: line.replace(/^([-*•]|\d+\.)\s+/, "") }
        : { type: "p" as const, text: line },
    );

  return (
    <div className="space-y-1.5">
      {blocks.map((b, i) =>
        b.type === "li" ? (
          <div key={i} className="flex gap-2">
            <span
              aria-hidden
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50"
            />
            <span>{formatInline(b.text)}</span>
          </div>
        ) : (
          <p key={i}>{formatInline(b.text)}</p>
        ),
      )}
    </div>
  );
}

export function AssistantChat({
  pageContext,
  suggestions = [],
  className,
  placeholder = "Pregunta o pide una acción…",
}: AssistantChatProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingApproval | null>(null);
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [turns, pending, isPending, reduceMotion]);

  function ask(question: string) {
    const q = question.trim();
    if (!q || isPending) return;
    setError(null);
    setInput("");
    // A new question supersedes any approval still on screen.
    setPending(null);
    const history = turns;
    setTurns((t) => [...t, { role: "user", content: q }]);

    startTransition(async () => {
      const res = await askAssistant(q, pageContext, history);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setTurns((t) => [...t, { role: "assistant", content: res.text }]);
      if (res.pending) setPending(res.pending);
      else router.refresh();
    });
  }

  function confirm() {
    const approval = pending;
    if (!approval || isPending) return;
    setPending(null);
    startTransition(async () => {
      const res = await confirmAssistantAction(approval.ticket);
      if (res.ok) {
        setTurns((t) => [...t, { role: "assistant", content: res.text }]);
        toast.success(res.text);
        router.refresh();
      } else {
        setError(res.message);
        toast.error(res.message);
      }
    });
  }

  function cancel() {
    setPending(null);
    setTurns((t) => [
      ...t,
      { role: "assistant", content: "De acuerdo, no hice ningún cambio." },
    ]);
  }

  const empty = turns.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        className={cn(
          "min-h-0 flex-1 space-y-3 overflow-y-auto pr-1",
          className,
        )}
      >
        {empty && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border bg-muted/40 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {turns.map((t, i) => (
          <motion.div
            key={i}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex",
              t.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                t.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border bg-muted/40",
              )}
            >
              {t.role === "user" ? t.content : <AnswerBody text={t.content} />}
            </div>
          </motion.div>
        ))}

        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            Trabajando…
          </div>
        )}

        {pending && (
          <motion.div
            role="alertdialog"
            aria-label="Confirmar acción"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3 rounded-xl border border-warning/40 bg-warning/[0.07] p-3.5"
          >
            <div className="flex gap-2.5">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                aria-hidden
              />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Confirma esta acción</p>
                <p className="text-muted-foreground">{pending.summary}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirm} disabled={isPending}>
                <Check aria-hidden /> Confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancel}
                disabled={isPending}
              >
                <X aria-hidden /> Cancelar
              </Button>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex shrink-0 gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          aria-label="Mensaje para el copiloto"
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isPending}
        />
        <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
