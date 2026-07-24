import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrgBySlug } from "@/lib/loyalty/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecoveryForm } from "@/components/public/RecoveryForm";

interface PageProps {
  params: Promise<{ organizationSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { organizationSlug } = await params;
  const org = await getOrgBySlug(organizationSlug);
  return {
    title: org ? `Recuperar tarjeta · ${org.name}` : "Recuperar tarjeta",
  };
}

/** Public card recovery (§13, §14). */
export default async function RecuperarPage({ params }: PageProps) {
  const { organizationSlug } = await params;
  const org = await getOrgBySlug(organizationSlug);
  if (!org) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <div
            className="mb-2 h-1.5 w-12 rounded-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${org.primaryColor}, ${org.secondaryColor})`,
            }}
          />
          <CardTitle className="text-xl">Recupera tu tarjeta</CardTitle>
          <CardDescription>
            Ingresa el teléfono y la placa con los que te inscribiste en{" "}
            {org.name}. Te generaremos un enlace nuevo con tu tarjeta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecoveryForm slug={org.slug} />
        </CardContent>
      </Card>
    </main>
  );
}
