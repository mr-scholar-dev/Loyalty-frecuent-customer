import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSampleOrg } from "@/lib/org/sample";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnrollmentForm } from "@/components/public/EnrollmentForm";

interface PageProps {
  params: Promise<{ organizationSlug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { organizationSlug } = await params;
  const org = getSampleOrg(organizationSlug);
  return { title: org ? `Inscripción · ${org.brand.name}` : "Inscripción" };
}

/** Public enrollment form (§14, §10 Flujo B). */
export default async function RegistroPage({ params }: PageProps) {
  const { organizationSlug } = await params;
  const org = getSampleOrg(organizationSlug);
  if (!org) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <div
            className="mb-2 h-1.5 w-12 rounded-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${org.brand.primaryColor}, ${org.brand.secondaryColor})`,
            }}
          />
          <CardTitle className="text-xl">
            Inscríbete en {org.brand.name}
          </CardTitle>
          <CardDescription>
            Completa tus datos y recibe tu tarjeta digital con QR al instante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnrollmentForm slug={org.slug} />
        </CardContent>
      </Card>
    </main>
  );
}
