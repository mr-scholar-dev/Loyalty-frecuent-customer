import type { Metadata } from "next";
import { getActiveMembership } from "@/lib/supabase/auth";
import { generateQrAssets } from "@/lib/qr/generate";
import { Card, CardContent } from "@/components/ui/card";
import { EnrollmentQrActions } from "@/components/dashboard/EnrollmentQrActions";

export const metadata: Metadata = { title: "QR de registro" };
export const dynamic = "force-dynamic";

/**
 * Public enrollment QR for the servicentro to print/display (§10 Flujo A).
 * Customers scan it to open the enrollment form and get their digital card.
 */
export default async function EnrollmentQrPage() {
  const membership = await getActiveMembership();
  const slug = membership?.organizationSlug ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3200";
  const url = `${appUrl.replace(/\/$/, "")}/${slug}/registro`;
  const { svg, pngDataUrl } = await generateQrAssets(url);

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">QR de registro</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Imprime o muestra este código. Tus clientes lo escanean, llenan el
        formulario y reciben su tarjeta digital al instante.
      </p>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-lg font-bold">
            {membership?.organizationName ?? "Servicentro"}
          </p>
          <p className="text-sm text-muted-foreground">
            Escanea para inscribirte y acumular lavados
          </p>
          <div
            className="h-64 w-64 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
            role="img"
            aria-label="Código QR de registro"
          />
          <a
            href={url}
            className="break-all text-xs font-medium text-primary underline underline-offset-2"
          >
            {url}
          </a>
        </CardContent>
      </Card>

      <div className="mt-4">
        <EnrollmentQrActions url={url} qrPngDataUrl={pngDataUrl} slug={slug} />
      </div>

      <p className="mt-4 text-xs text-muted-foreground print:hidden">
        En producción, el QR usará tu dominio real (configura
        <code className="mx-1">NEXT_PUBLIC_APP_URL</code>) para que sea
        escaneable desde cualquier teléfono.
      </p>
    </main>
  );
}
