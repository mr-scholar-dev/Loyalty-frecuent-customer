import Link from "next/link";

/**
 * Minimal platform landing (Phase 0). Real marketing content and the
 * organization directory are out of scope until later phases.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Loyalty Web
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Plataforma de fidelización para servicentros
        </h1>
        <p className="text-muted-foreground">
          Base técnica inicial (Fase 0). Las funciones de registro, tarjeta
          digital, escaneo y recompensas se habilitan en fases posteriores.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm text-card-foreground">
        <p className="font-medium">Tarjeta digital (demostración)</p>
        <p className="mb-3 text-muted-foreground">
          Ejemplos de la tarjeta pública del cliente con datos ficticios:
        </p>
        <ul className="space-y-1">
          <li>
            <Link
              href="/c/demo"
              className="font-medium text-primary underline underline-offset-4"
            >
              /c/demo
            </Link>{" "}
            — progreso 3 de 9
          </li>
          <li>
            <Link
              href="/c/demo-reward"
              className="font-medium text-primary underline underline-offset-4"
            >
              /c/demo-reward
            </Link>{" "}
            — con lavado gratis disponible
          </li>
          <li>
            <Link
              href="/c/demo-blocked"
              className="font-medium text-primary underline underline-offset-4"
            >
              /c/demo-blocked
            </Link>{" "}
            — tarjeta bloqueada
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm text-card-foreground">
        <p className="font-medium">Estado del sistema</p>
        <p className="text-muted-foreground">
          Verifica la salud del servicio en{" "}
          <Link
            href="/api/health"
            className="font-medium text-primary underline underline-offset-4"
          >
            /api/health
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
