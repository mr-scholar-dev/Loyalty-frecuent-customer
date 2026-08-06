"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantChat } from "@/components/dashboard/AssistantChat";

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
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <AssistantChat
            pageContext={pageLabel}
            suggestions={suggestions}
            placeholder={`Pide algo sobre ${pageLabel.toLowerCase()}…`}
          />
        </div>
      </aside>
    </div>,
    document.body,
  );
}
