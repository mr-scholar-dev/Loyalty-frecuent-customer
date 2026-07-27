"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { askAssistant } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Global AI copilot: a top-bar launcher + right-side drawer available on every
 * dashboard page. It reads the current route so the assistant knows which
 * screen the user is on and can offer help/actions relevant to that section.
 */

interface PageInfo {
  label: string;
  suggestions: string[];
}

const GENERIC_SUGGESTIONS = [
  "¿Cómo va el negocio hoy?",
  "¿Qué clientes están por dejar de venir?",
];

/** Map a pathname to a friendly label + contextual suggestions. Ordered most
 * specific first. */
const PAGES: { match: (p: string) => boolean; info: PageInfo }[] = [
  {
    match: (p) => p.startsWith("/dashboard/kanban"),
    info: {
      label: "Tablero Kanban",
      suggestions: [
        "Crea una tarea: revisar la bomba de agua, en Por hacer.",
        "Agenda seguimiento a los clientes en riesgo y asígnalo a Carlos.",
      ],
    },
  },
  {
    match: (p) => /^\/dashboard\/customers\/[^/]+/.test(p),
    info: {
      label: "Detalle de cliente",
      suggestions: [
        "Redáctame un mensaje de WhatsApp para reactivar a este cliente.",
      ],
    },
  },
  {
    match: (p) => p.startsWith("/dashboard/customers"),
    info: {
      label: "Clientes",
      suggestions: [
        "Busca clientes por placa o nombre.",
        "¿Quiénes están a un lavado del premio?",
      ],
    },
  },
  {
    match: (p) => p.startsWith("/dashboard/team"),
    info: {
      label: "Equipo",
      suggestions: ["¿Quién está en mi equipo?"],
    },
  },
  {
    match: (p) => p.startsWith("/dashboard/visits"),
    info: {
      label: "Visitas",
      suggestions: ["¿Cuántos lavados llevamos este mes?"],
    },
  },
  {
    match: (p) => p.startsWith("/dashboard/billing"),
    info: {
      label: "Facturación",
      suggestions: ["¿Qué incluye mi plan?"],
    },
  },
  {
    match: (p) => p === "/dashboard",
    info: {
      label: "Panel principal",
      suggestions: [
        "Resume cómo va el negocio y qué debería hacer hoy.",
        "Crea una tarea de seguimiento en el Kanban.",
      ],
    },
  },
];

function pageInfo(pathname: string): PageInfo {
  const found = PAGES.find((p) => p.match(pathname));
  return (
    found?.info ?? {
      label: "Panel de Loyalty Web",
      suggestions: GENERIC_SUGGESTIONS,
    }
  );
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

export function Copilot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const info = pageInfo(pathname);

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
        aria-label="Abrir asistente IA"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        Asistente
      </Button>

      {open && (
        <CopilotDrawer
          pageLabel={info.label}
          suggestions={info.suggestions}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function CopilotDrawer({
  pageLabel,
  suggestions,
  onClose,
}: {
  pageLabel: string;
  suggestions: string[];
  onClose: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, isPending]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function ask(question: string) {
    const q = question.trim();
    if (!q || isPending) return;
    setError(null);
    setInput("");
    setTurns((t) => [...t, { role: "user", content: q }]);
    startTransition(async () => {
      const res = await askAssistant(q, pageLabel);
      if (res.ok) {
        setTurns((t) => [...t, { role: "assistant", content: res.text }]);
        // Refresh the page behind the panel so any change the assistant made
        // (e.g. a new Kanban task) shows immediately.
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return createPortal(
    // Non-modal: the wrapper ignores pointer events so the app behind stays
    // fully visible and interactive; only the panel captures clicks.
    <div className="pointer-events-none fixed inset-0 z-50">
      <aside className="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l bg-card shadow-2xl duration-200 animate-in slide-in-from-right-8">
        <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              Asistente IA
            </p>
            <p className="text-xs text-muted-foreground">
              Viendo: <span className="font-medium">{pageLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
        >
          {turns.length === 0 ? (
            <div className="flex h-full flex-col justify-center gap-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" aria-hidden />
              </div>
              <p className="text-sm text-muted-foreground">
                Puedo consultar tu negocio y ejecutar acciones. Prueba con:
              </p>
              <div className="flex flex-col gap-2 text-left">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            turns.map((t, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  t.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                    t.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-muted/40",
                  )}
                >
                  {t.content}
                </div>
              </div>
            ))
          )}
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Pensando…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex shrink-0 gap-2 border-t p-3"
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Pide algo sobre ${pageLabel.toLowerCase()}…`}
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !input.trim()}
          >
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      </aside>
    </div>,
    document.body,
  );
}
