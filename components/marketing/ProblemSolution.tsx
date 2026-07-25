import { Check, X } from "lucide-react";

const BEFORE = [
  "Tarjetas que se pierden.",
  "Sellos difíciles de controlar.",
  "Sin historial confiable.",
  "Sin información sobre clientes inactivos.",
  "Recompensas susceptibles a errores.",
];

const AFTER = [
  "Historial digital.",
  "QR único por cliente.",
  "Progreso automático.",
  "Acciones auditables.",
  "Información para recuperar clientes.",
];

export function ProblemSolution() {
  return (
    <section className="border-b py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Tu programa de fidelización no debería depender del papel.
        </h2>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border bg-muted/40 p-7 sm:p-9">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Antes
            </p>
            <ul className="mt-5 space-y-3.5">
              {BEFORE.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
                    <X className="h-3 w-3" aria-hidden />
                  </span>
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="shadow-float rounded-2xl border border-primary/30 bg-card p-7 ring-1 ring-primary/10 sm:p-9">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              Con la plataforma
            </p>
            <ul className="mt-5 space-y-3.5">
              {AFTER.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  <span className="font-medium text-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
