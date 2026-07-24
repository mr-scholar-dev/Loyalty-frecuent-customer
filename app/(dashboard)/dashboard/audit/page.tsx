import type { Metadata } from "next";
import { getAuditLog } from "@/lib/loyalty/demo-store";
import { formatDateTimeCR } from "@/lib/loyalty/event-format";

export const metadata: Metadata = { title: "Auditoría" };
export const dynamic = "force-dynamic";

export default function AuditPage() {
  const entries = getAuditLog();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Auditoría</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Registro de acciones administrativas (bloqueos, reemisiones,
        reversiones).
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Fecha</th>
              <th className="px-4 py-2.5 font-medium">Acción</th>
              <th className="px-4 py-2.5 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((e, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                  {formatDateTimeCR(e.at)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{e.action}</td>
                <td className="px-4 py-2.5">{e.detail}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Sin acciones registradas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
