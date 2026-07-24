import type { Metadata } from "next";
import { LoyaltyEventType } from "@/types/domain";
import { getVisitLog } from "@/lib/loyalty/admin-queries";
import { EVENT_LABELS, formatDateTimeCR } from "@/lib/loyalty/event-format";

export const metadata: Metadata = { title: "Visitas" };
export const dynamic = "force-dynamic";

export default async function VisitsPage() {
  const visits = await getVisitLog();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Visitas</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Historial de lavados registrados y revertidos.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Fecha</th>
              <th className="px-4 py-2.5 font-medium">Tipo</th>
              <th className="px-4 py-2.5 font-medium">Cliente</th>
              <th className="px-4 py-2.5 font-medium">Placa</th>
              <th className="px-4 py-2.5 font-medium">Servicentro</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visits.map((v, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 text-muted-foreground">
                  {formatDateTimeCR(v.at)}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      v.type === LoyaltyEventType.VisitReversed
                        ? "text-destructive"
                        : ""
                    }
                  >
                    {EVENT_LABELS[v.type]}
                  </span>
                </td>
                <td className="px-4 py-2.5">{v.customerFullName}</td>
                <td className="px-4 py-2.5">{v.licensePlate}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {v.organizationName}
                </td>
              </tr>
            ))}
            {visits.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Sin visitas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
