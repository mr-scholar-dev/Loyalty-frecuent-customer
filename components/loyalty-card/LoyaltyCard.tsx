import { Gift, MapPin } from "lucide-react";
import { MembershipStatus } from "@/types/domain";
import { formatLastActivity, type CardView } from "@/lib/loyalty/card";
import { ProgressDots } from "@/components/loyalty-card/ProgressDots";
import { CardActions } from "@/components/loyalty-card/CardActions";
import { TokenCopy } from "@/components/loyalty-card/TokenCopy";

interface LoyaltyCardProps {
  card: CardView;
  /** Inline SVG markup for the QR code. */
  qrSvg: string;
  /** PNG data URL of the QR, for download. */
  qrPngDataUrl: string;
}

/**
 * Premium-looking public loyalty card (§16). Presentational only; all data is
 * the safe `CardView` projection. Branded with the organization colors.
 */
export function LoyaltyCard({ card, qrSvg, qrPngDataUrl }: LoyaltyCardProps) {
  const { organization, progress } = card;
  const isActive = card.status === MembershipStatus.Active;
  const hasReward = progress.availableRewards > 0;
  // The card URL is `${base}/c/{token}`; the scan console accepts either the
  // full link or the bare token.
  const token = card.cardUrl.split("/").filter(Boolean).pop() ?? "";

  return (
    <div className="animate-rise mx-auto w-full max-w-sm space-y-4">
      {/* The card */}
      <div
        className="overflow-hidden rounded-3xl text-white shadow-xl ring-1 ring-black/5"
        style={{
          backgroundImage: `linear-gradient(135deg, ${organization.primaryColor}, ${organization.secondaryColor})`,
        }}
      >
        <div className="space-y-5 p-6">
          {/* Header: brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {organization.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="h-8 w-8 rounded-full bg-white/20 object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {organization.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-semibold">{organization.name}</span>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide">
              {isActive ? "Activa" : "Bloqueada"}
            </span>
          </div>

          {/* Customer + plate */}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-white/70">
              Cliente
            </p>
            <p className="text-xl font-bold">{card.customerDisplayName}</p>
            <p className="text-sm font-medium text-white/90">
              {card.licensePlate}
            </p>
          </div>

          {/* Reward banner */}
          {hasReward && (
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold">
              <Gift className="h-4 w-4" aria-hidden />
              {progress.availableRewards === 1
                ? "1 lavado gratis disponible"
                : `${progress.availableRewards} lavados gratis disponibles`}
            </div>
          )}

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">{progress.progressLabel}</p>
              <p className="text-xs text-white/80">{progress.remainingLabel}</p>
            </div>
            <ProgressDots
              current={progress.current}
              required={progress.required}
            />
          </div>

          {/* QR */}
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4">
            <div
              className="h-44 w-44 [&>svg]:h-full [&>svg]:w-full"
              // QR SVG is generated server-side by the `qrcode` library.
              dangerouslySetInnerHTML={{ __html: qrSvg }}
              aria-label="Código QR de la tarjeta"
              role="img"
            />
            <p className="text-center text-[11px] font-medium text-slate-500">
              Muestra este código en el servicentro
            </p>
            {token && <TokenCopy token={token} />}
          </div>

          {/* Footer meta */}
          <div className="flex items-center justify-between text-[11px] text-white/70">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden />
              {organization.name}
            </span>
            <span>Actualizado: {formatLastActivity(card.lastActivityAt)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <CardActions
        cardUrl={card.cardUrl}
        qrPngDataUrl={qrPngDataUrl}
        plate={card.licensePlate}
      />

      {/* Save instructions (§10 Flujo C) */}
      <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
        <p className="mb-1 font-semibold text-foreground">Guarda tu tarjeta</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>Agrega esta página a tu pantalla de inicio.</li>
          <li>Guárdala en favoritos del navegador.</li>
          <li>Comparte el enlace contigo por WhatsApp o correo.</li>
        </ul>
      </div>
    </div>
  );
}
