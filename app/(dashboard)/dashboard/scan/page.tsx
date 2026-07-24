import type { Metadata } from "next";
import { ScanLine } from "lucide-react";
import { ScanConsole } from "@/components/scanner/ScanConsole";

export const metadata: Metadata = {
  title: "Escanear",
};

/**
 * Staff scan console (§10 Flujo D/E/F, §Fase6).
 *
 * NOTE (demo): not yet behind authentication. Auth/session + role checks are
 * added with the deferred database phase; today it operates on the in-memory
 * demo store.
 */
export default function ScanPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <ScanLine className="h-6 w-6 text-primary" aria-hidden />
        <h1 className="text-2xl font-bold">Escanear tarjeta</h1>
      </div>

      <ScanConsole />

      <div className="mt-8 rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
        <p className="mb-1 font-semibold text-foreground">
          Tokens de prueba (demo)
        </p>
        <ul className="space-y-0.5">
          <li>
            <code>demo</code> — progreso 3/9
          </li>
          <li>
            <code>demo-reward</code> — con recompensa disponible
          </li>
          <li>
            <code>demo-blocked</code> — tarjeta bloqueada
          </li>
        </ul>
      </div>
    </main>
  );
}
