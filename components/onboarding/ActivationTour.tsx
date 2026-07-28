"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Sparkles,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  Bot,
  AlertTriangle,
  KanbanSquare,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createCheckout } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PRO_PRICE_USD,
  PRO_PRICE_USD_ANNUAL,
  WHATSAPP_URL,
  CONTACT_PHONE,
} from "@/lib/site";

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: Users,
    title: "Tarjeta digital de fidelización",
    body: "Tus clientes acumulan visitas y canjean premios desde el teléfono. Sin tarjetas de papel que se pierden.",
  },
  {
    icon: Bot,
    title: "Copiloto con IA",
    body: "Pregúntale lo que sea de tu negocio y déjalo crear tareas por vos. Conoce cada pantalla en la que estás.",
  },
  {
    icon: AlertTriangle,
    title: "Clientes en riesgo",
    body: "Detecta quién dejó de venir y genera mensajes de reactivación listos para enviar por WhatsApp.",
  },
  {
    icon: KanbanSquare,
    title: "Tablero de tu equipo",
    body: "Organiza tareas en un Kanban, asigna responsables y lleva reportes, sucursales y auditoría.",
  },
];

const PLAN_FEATURES = [
  "Copiloto con IA (consulta y crea tareas)",
  "Clientes en riesgo + mensajes de reactivación",
  "Tablero Kanban con tu equipo",
  "Sucursales y clientes ilimitados",
  "Reportes, exportación y auditoría",
  "Soporte por WhatsApp",
];

export function ActivationTour({ orgName }: { orgName: string }) {
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const go = useCallback((next: number) => {
    const total = SLIDES.length;
    setIndex(((next % total) + total) % total);
  }, []);

  // Gentle auto-advance; pauses are unnecessary for a short 4-slide tour.
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  function activate() {
    setMessage(null);
    startTransition(async () => {
      const result = await createCheckout();
      if (result && !result.ok) setMessage(result.message);
    });
  }

  const slide = SLIDES[index] ?? SLIDES[0];
  if (!slide) return null;
  const Icon = slide.icon;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      {/* Tour */}
      <section aria-label="Recorrido por Loyalty Web">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Bienvenido{orgName ? `, ${orgName}` : ""}
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Tu cuenta está lista.
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Activá tu plan para empezar a usar Loyalty Web. Mientras tanto, este es
          un recorrido rápido de lo que vas a tener.
        </p>

        <div className="shadow-soft mt-6 rounded-2xl border bg-card p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold">{slide.title}</h2>
          <p className="mt-1 min-h-[3.5rem] text-sm text-muted-foreground">
            {slide.body}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1.5" role="tablist" aria-label="Pasos">
              {SLIDES.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-label={`Ir al paso ${i + 1}`}
                  aria-selected={i === index}
                  onClick={() => go(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Anterior"
                onClick={() => go(index - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={() => go(index + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Activation card */}
      <section
        aria-label="Activar plan"
        className="shadow-float rounded-2xl border bg-card p-6 ring-1 ring-primary/15"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            Plan Pro
          </span>
          <span className="text-right">
            <span className="font-mono text-3xl font-bold">${PRO_PRICE_USD}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              /mes
            </span>
            <span className="block text-xs text-primary">
              o ${PRO_PRICE_USD_ANNUAL}/mes anual
            </span>
          </span>
        </div>

        <ul className="mt-5 space-y-2 text-sm">
          {PLAN_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2">
          <Button
            size="lg"
            className="w-full"
            onClick={activate}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <CreditCard aria-hidden />
            )}
            Activar mi plan
          </Button>
          {message && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              {message}
            </p>
          )}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            ¿Dudas? Escríbenos al {CONTACT_PHONE}
          </a>
        </div>
      </section>
    </div>
  );
}
