import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getMembershipDetail } from "@/lib/loyalty/demo-store";
import { EVENT_LABELS, formatDateTimeCR } from "@/lib/loyalty/event-format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CustomerActions } from "@/components/dashboard/CustomerActions";

export const metadata: Metadata = { title: "Cliente" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params;
  const detail = getMembershipDetail(customerId);
  if (!detail) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/dashboard/customers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Clientes
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{detail.customerFullName}</h1>
          <p className="text-sm text-muted-foreground">
            {detail.organizationName}
          </p>
        </div>
        <StatusBadge status={detail.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Teléfono" value={detail.phoneNormalized ?? "—"} />
            <Row label="Placa" value={detail.licensePlate} />
            <Row label="Alta" value={formatDateTimeCR(detail.joinedAt)} />
            <Row
              label="Última actividad"
              value={
                detail.lastActivityAt
                  ? formatDateTimeCR(detail.lastActivityAt)
                  : "—"
              }
            />
            <div className="pt-1">
              <Link
                href={`/c/${detail.id}`}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                target="_blank"
              >
                Ver tarjeta pública <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-2xl font-bold tabular-nums">
              {detail.progress.current}/{detail.progress.required}
            </p>
            <p className="text-muted-foreground">
              {detail.progress.remainingLabel}
            </p>
            <p className="pt-1">
              Recompensas disponibles:{" "}
              <span className="font-semibold">
                {detail.progress.availableRewards}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerActions
            token={detail.id}
            status={detail.status}
            canReverse={detail.progress.current > 0}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Historial (ledger)</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.events.length > 0 ? (
            <ul className="divide-y text-sm">
              {detail.events.map((e, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>{EVENT_LABELS[e.type]}</span>
                  <span className="text-muted-foreground">
                    {formatDateTimeCR(e.at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin movimientos registrados.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
