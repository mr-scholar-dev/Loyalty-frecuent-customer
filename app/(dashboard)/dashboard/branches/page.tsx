import type { Metadata } from "next";
import { getActiveMembership } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  BranchManager,
  type BranchItem,
} from "@/components/dashboard/BranchManager";

export const metadata: Metadata = { title: "Sucursales" };
export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const membership = await getActiveMembership();
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, name, code, status")
    .eq("organization_id", membership?.organizationId ?? "")
    .order("created_at", { ascending: true });

  const branches: BranchItem[] = (data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code,
    status: b.status as BranchItem["status"],
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Sucursales</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Administra las sucursales de tu servicentro.
      </p>
      <BranchManager branches={branches} />
    </main>
  );
}
