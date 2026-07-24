import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { getOrgBySlug } from "@/lib/loyalty/queries";
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
  return { title: org ? org.name : "Servicentro" };
}

/** Public landing for a servicentro (§14). */
export default async function OrganizationLanding({ params }: PageProps) {
  const { organizationSlug } = await params;
  const brand = await getOrgBySlug(organizationSlug);
  if (!brand) notFound();

  return (
    <main className="min-h-screen px-4 py-10">
      <div
        className="mx-auto max-w-md space-y-6 rounded-3xl p-8 text-white shadow-xl"
        style={{
          backgroundImage: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})`,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
            {brand.name.charAt(0)}
          </div>
          <span className="text-lg font-semibold">{brand.name}</span>
        </div>

        <div className="space-y-2">
          <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Cliente frecuente
          </p>
          <h1 className="text-2xl font-bold leading-tight">
            Acumula lavados y gana premios
          </h1>
          <p className="text-white/90">
            {brand.paidVisitsRequired} lavados pagados y el siguiente es gratis.
            Inscríbete en menos de dos minutos y recibe tu tarjeta digital.
          </p>
        </div>

        <Link
          href={`/${brand.slug}/registro`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "w-full",
          )}
        >
          Inscribirme <ArrowRight aria-hidden />
        </Link>
      </div>
    </main>
  );
}
