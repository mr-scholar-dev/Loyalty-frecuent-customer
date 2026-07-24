import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { MembershipStatus } from "@/types/domain";
import { getCardViewByToken } from "@/lib/loyalty/queries";
import { generateQrAssets } from "@/lib/qr/generate";
import { LoyaltyCard } from "@/components/loyalty-card/LoyaltyCard";

interface PageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Mi tarjeta",
  robots: { index: false, follow: false },
};

/**
 * Public digital card (§10 Flujo C). Looks up the membership by hashed token in
 * Supabase (admin client — public pages have no session; the token is the
 * capability).
 */
export const dynamic = "force-dynamic";

export default async function CardPage({ params }: PageProps) {
  const { token } = await params;
  const card = await getCardViewByToken(token);

  if (!card) {
    notFound();
  }

  if (card.status === MembershipStatus.Blocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
        <div className="space-y-3 rounded-3xl border bg-card p-6 text-center shadow">
          <ShieldAlert
            className="mx-auto h-10 w-10 text-destructive"
            aria-hidden
          />
          <h1 className="text-lg font-bold">Tarjeta bloqueada</h1>
          <p className="text-sm text-muted-foreground">
            Esta tarjeta está temporalmente inactiva. Acércate al servicentro
            <span className="font-medium"> {card.organization.name} </span>
            para reactivarla o emitir una nueva.
          </p>
        </div>
      </main>
    );
  }

  const { svg, pngDataUrl } = await generateQrAssets(card.cardUrl);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <LoyaltyCard card={card} qrSvg={svg} qrPngDataUrl={pngDataUrl} />
    </main>
  );
}
