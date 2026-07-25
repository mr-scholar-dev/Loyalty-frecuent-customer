import { Sparkles, ArrowUpRight } from "lucide-react";

const EXAMPLES = [
  "¿Qué clientes no han regresado este mes?",
  "Resume la actividad de esta semana.",
  "¿Qué recompensas están próximas a liberarse?",
];

const FINDINGS = [
  { label: "Frecuencia promedio menor a 20 días", value: "6" },
  { label: "Sin visitas hace más de 30 días", value: "12" },
];

const PRIORITY = [
  { name: "José Vargas", days: "41" },
  { name: "Paola Ramírez", days: "36" },
];

export function AiAssistantSection() {
  return (
    <section className="border-b py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
        <div className="max-w-md">
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Asistente
          </p>
          <h2 className="mt-4 text-balance text-3xl font-bold leading-[1.12] tracking-tight sm:text-4xl">
            Información útil, no otro dashboard que interpretar.
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
            Pregunta por tu negocio en palabras simples y recibe una respuesta
            clara. El asistente revisa tus datos y señala dónde vale la pena
            actuar; tú decides el siguiente paso.
          </p>

          <p className="mt-8 text-xs font-medium text-foreground">
            Por ejemplo, puedes preguntar:
          </p>
          <ul className="mt-3 space-y-2">
            {EXAMPLES.map((q) => (
              <li
                key={q}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {q}
              </li>
            ))}
          </ul>
        </div>

        {/* Analyst panel (decorative illustration). */}
        <div
          aria-hidden
          className="shadow-soft overflow-hidden rounded-2xl border bg-card"
        >
          <div className="border-b bg-muted/40 px-5 py-3">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Consulta
            </p>
            <p className="mt-1 text-sm font-medium">
              ¿Qué clientes no han regresado este mes?
            </p>
          </div>

          <div className="p-5">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Respuesta
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tracking-tight">
                18
              </span>
              <span className="text-sm font-medium text-foreground">
                clientes en riesgo de abandono
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {FINDINGS.map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border bg-background p-3.5"
                >
                  <p className="font-mono text-xl font-semibold">{f.value}</p>
                  <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                    {f.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-medium text-muted-foreground">
                Prioridad de contacto
              </p>
              <ul className="mt-2 divide-y divide-border rounded-xl border">
                {PRIORITY.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between px-3.5 py-2.5"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/10 font-mono text-[9px] font-semibold text-warning">
                        {p.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </span>
                      <span className="text-sm">{p.name}</span>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.days} días
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex items-center gap-1.5 rounded-lg bg-primary/[0.06] px-3.5 py-2.5 text-[11px] text-foreground/80">
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary" />
              Prioriza a quienes estaban cerca de una recompensa.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
