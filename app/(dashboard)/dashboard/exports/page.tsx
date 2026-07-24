import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "@/components/dashboard/ExportButton";

export const metadata: Metadata = { title: "Exportar" };

/** CSV exports (§15). Downloads are served by the /api/export route handler. */
export default function ExportsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Exportar</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Descarga los datos del programa en formato CSV.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Todos los clientes con su progreso y estado.
            </p>
            <ExportButton type="customers" label="Descargar clientes.csv" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Historial de lavados registrados y revertidos.
            </p>
            <ExportButton type="visits" label="Descargar visitas.csv" />
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        En producción, la exportación respetará la organización del usuario
        (RLS) y sus permisos.
      </p>
    </main>
  );
}
