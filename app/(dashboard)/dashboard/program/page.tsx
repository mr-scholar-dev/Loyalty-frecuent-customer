import type { Metadata } from "next";
import { getActiveMembership } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramForm } from "@/components/dashboard/ProgramForm";

export const metadata: Metadata = { title: "Programa" };
export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const membership = await getActiveMembership();
  const supabase = await createClient();
  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("name, paid_visits_required, reward_quantity, reward_name")
    .eq("organization_id", membership?.organizationId ?? "")
    .eq("status", "active")
    .maybeSingle();

  const isOwner = membership?.role === "owner";

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Programa de fidelización</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Define cuántos lavados pagados generan una recompensa.
      </p>

      {!isOwner && (
        <p className="mb-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Solo el propietario puede editar el programa.
        </p>
      )}

      {program ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Programa activo</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgramForm
              name={program.name}
              paidVisitsRequired={program.paid_visits_required}
              rewardQuantity={program.reward_quantity}
              rewardName={program.reward_name}
            />
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          Esta organización no tiene un programa activo.
        </p>
      )}
    </main>
  );
}
