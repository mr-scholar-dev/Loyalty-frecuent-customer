import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSampleOrg } from "@/lib/org/sample";
import { resolveCardView } from "@/lib/loyalty/demo-store";
import { generateQrAssets } from "@/lib/qr/generate";
import { LoyaltyCard } from "@/components/loyalty-card/LoyaltyCard";

interface PageProps {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: "¡Listo!",
  robots: { index: false, follow: false },
};

/** Enrollment success (§14, §10 Flujo B). Shows the freshly issued card. */
export default async function RegistroExitoPage({
  params,
  searchParams,
}: PageProps) {
  const { organizationSlug } = await params;
  const { token } = await searchParams;
  const org = getSampleOrg(organizationSlug);
  if (!org) notFound();

  const card = token ? resolveCardView(token) : null;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto mb-6 max-w-sm text-center">
        <CheckCircle2
          className="mx-auto mb-2 h-12 w-12 text-emerald-600"
          aria-hidden
        />
        <h1 className="text-2xl font-bold">¡Tu tarjeta está lista!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guarda esta página para no perderla: agrégala a tu pantalla de inicio
          o a favoritos, o compártela contigo por WhatsApp.
        </p>
      </div>

      {card ? (
        <ExitoCard token={token!} card={card} />
      ) : (
        <div className="mx-auto max-w-sm rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No pudimos cargar tu tarjeta.{" "}
          <Link
            href={`/${org.slug}/registro`}
            className="font-medium text-primary underline underline-offset-4"
          >
            Volver a intentar
          </Link>
        </div>
      )}
    </main>
  );
}

async function ExitoCard({
  token,
  card,
}: {
  token: string;
  card: NonNullable<ReturnType<typeof resolveCardView>>;
}) {
  const { svg, pngDataUrl } = await generateQrAssets(card.cardUrl);
  return (
    <>
      <LoyaltyCard card={card} qrSvg={svg} qrPngDataUrl={pngDataUrl} />
      <p className="mx-auto mt-4 max-w-sm text-center text-xs text-muted-foreground">
        Enlace permanente de tu tarjeta:{" "}
        <Link
          href={`/c/${token}`}
          className="break-all font-medium text-primary underline underline-offset-2"
        >
          /c/{token}
        </Link>
      </p>
    </>
  );
}
