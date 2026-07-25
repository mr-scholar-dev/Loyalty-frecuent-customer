import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { MembershipStatus } from "@/types/domain";
import { listMemberships } from "@/lib/loyalty/admin-queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: MembershipStatus.Active, label: "Activas" },
  { value: MembershipStatus.Blocked, label: "Bloqueadas" },
  { value: "archived", label: "Archivados" },
];

function parseStatus(
  value: string | undefined,
): MembershipStatus | "all" | "archived" {
  if (
    value === MembershipStatus.Active ||
    value === MembershipStatus.Blocked ||
    value === MembershipStatus.Expired ||
    value === "archived"
  ) {
    return value;
  }
  return "all";
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams;
  const statusFilter = parseStatus(status);
  const items = await listMemberships({ query: q, status: statusFilter });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Clientes</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Busca por nombre, teléfono o placa.
      </p>

      <form className="mb-5 flex flex-wrap gap-2" action="/dashboard/customers">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre, teléfono o placa…"
          className="max-w-xs"
          aria-label="Buscar"
          autoFocus
          autoComplete="off"
          enterKeyHint="search"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          aria-label="Filtrar por estado"
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit">
          <Search aria-hidden /> Buscar
        </Button>
      </form>

      <p className="mb-2 text-sm text-muted-foreground">
        {items.length} resultado(s)
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Cliente</th>
              <th className="px-4 py-2.5 font-medium">Placa</th>
              <th className="px-4 py-2.5 font-medium">Servicentro</th>
              <th className="px-4 py-2.5 font-medium">Progreso</th>
              <th className="px-4 py-2.5 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/dashboard/customers/${item.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {item.customerFullName}
                  </Link>
                  {item.phoneNormalized && (
                    <p className="text-xs text-muted-foreground">
                      {item.phoneNormalized}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2.5">{item.licensePlate}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {item.organizationName}
                </td>
                <td className="px-4 py-2.5 tabular-nums">
                  {item.progress.current}/{item.progress.required}
                  {item.progress.availableRewards > 0 && (
                    <span className="ml-1 text-xs font-medium text-success">
                      +{item.progress.availableRewards}🎁
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {item.archived ? (
                    <span className="inline-block rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Archivado
                    </span>
                  ) : (
                    <StatusBadge status={item.status} />
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-0">
                  {q ? (
                    <EmptyState
                      icon={Search}
                      title={`Sin resultados para «${q}»`}
                      description="Prueba con otro nombre, teléfono o placa."
                      action={{
                        label: "Ver todos los clientes",
                        href: "/dashboard/customers",
                      }}
                    />
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="Aún no tienes clientes"
                      description="Comparte tu QR de registro para que tu primer cliente cree su tarjeta digital."
                      action={{
                        label: "Ver QR de registro",
                        href: "/dashboard/qr",
                      }}
                    />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
