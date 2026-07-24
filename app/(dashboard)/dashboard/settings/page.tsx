import type { Metadata } from "next";
import { getActiveMembership } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const metadata: Metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const membership = await getActiveMembership();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, slug, primary_color, secondary_color")
    .eq("id", membership?.organizationId ?? "")
    .maybeSingle();

  const isOwner = membership?.role === "owner";

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Ajustes</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Marca de tu servicentro (afecta la tarjeta y la página pública).
      </p>

      {!isOwner && (
        <p className="mb-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Solo el propietario puede editar los ajustes.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {org?.name ?? "Servicentro"}{" "}
            <span className="font-normal text-muted-foreground">
              /{org?.slug}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            name={org?.name ?? ""}
            primaryColor={org?.primary_color ?? "#2563eb"}
            secondaryColor={org?.secondary_color ?? "#0ea5e9"}
          />
        </CardContent>
      </Card>
    </main>
  );
}
