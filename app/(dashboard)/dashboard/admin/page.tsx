import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { isSuperadmin } from "@/lib/supabase/auth";
import { listOrganizations } from "@/actions/superadmin";
import { AdminOrgActions } from "@/components/dashboard/AdminOrgActions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Superadmin" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  trial: "Pendiente de pago",
  suspended: "Suspendido",
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-success/10 text-success",
  trial: "bg-warning/10 text-warning",
  suspended: "bg-destructive/10 text-destructive",
};

export default async function SuperadminPage() {
  if (!(await isSuperadmin())) redirect("/dashboard");

  const orgs = await listOrganizations();
  const active = orgs.filter((o) => o.status === "active").length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-1 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
        <h1 className="text-2xl font-bold">Superadmin</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        {orgs.length} servicentro{orgs.length === 1 ? "" : "s"} · {active}{" "}
        activo
        {active === 1 ? "" : "s"}. Activa un socio cuando su pago caiga.
      </p>

      <div className="shadow-soft overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Servicentro</th>
              <th className="px-4 py-2.5 font-medium">Estado</th>
              <th className="px-4 py-2.5 font-medium">Registrado</th>
              <th className="px-4 py-2.5 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orgs.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aún no hay servicentros registrados.
                </td>
              </tr>
            )}
            {orgs.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{o.name}</p>
                  <p className="text-xs text-muted-foreground">/{o.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLE[o.status] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString("es-CR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <AdminOrgActions organizationId={o.id} status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
