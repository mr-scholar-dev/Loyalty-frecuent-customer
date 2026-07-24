import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getOrgBySlug } from "@/lib/loyalty/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

/**
 * Card recovery (§13) — assisted only. For security we don't offer public
 * self-service; the customer visits the servicentro and staff reissues the
 * card ("Reemitir tarjeta" in the admin), verifying identity in person.
 */
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
          <CardTitle className="text-xl">¿Perdiste tu tarjeta?</CardTitle>
          <CardDescription>
            Acércate a {org.name} con el teléfono y la placa con los que te
            inscribiste. El personal verificará tus datos y te reemitirá la
            tarjeta al instante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Por tu seguridad, la recuperación se hace en el servicentro (no en
              línea): así confirmamos tu identidad antes de emitir una tarjeta
              nueva.
            </p>
          </div>
          <Link
            href={`/${org.slug}`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Volver
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
