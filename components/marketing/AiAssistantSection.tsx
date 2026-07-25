import { Sparkles } from "lucide-react";

const QUESTIONS = [
  "¿Qué clientes llevan más tiempo sin regresar?",
  "Resume la actividad de esta semana.",
  "¿Qué recompensas están próximas a liberarse?",
  "Muéstrame los clientes con mayor frecuencia.",
];

export function AiAssistantSection() {
  return (
    <section className="border-b py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Asistente
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Información útil, no otro dashboard que interpretar.
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Un asistente para consultar la información de tu negocio en lenguaje
            natural y detectar oportunidades de retención, sin aprender reportes
            complicados. Tú decides qué hacer con lo que encuentra.
          </p>
        </div>

        <div
          aria-hidden
          className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
        >
          <div className="space-y-2.5">
            {QUESTIONS.map((q) => (
              <div
                key={q}
                className="flex items-center gap-2.5 rounded-xl border bg-muted/40 px-3.5 py-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-foreground/80">{q}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 px-1 text-xs text-muted-foreground">
            Disponible dentro del panel para consultar tus datos reales.
          </p>
        </div>
      </div>
    </section>
  );
}
