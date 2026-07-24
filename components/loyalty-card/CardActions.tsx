"use client";

import { useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CardActionsProps {
  cardUrl: string;
  qrPngDataUrl: string;
  plate: string;
}

/**
 * Client-side card actions (§10 Flujo C): share the card link and download the
 * QR image. Uses the Web Share API when available, falling back to clipboard.
 */
export function CardActions({
  cardUrl,
  qrPngDataUrl,
  plate,
}: CardActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareData = {
      title: "Mi tarjeta de fidelización",
      text: "Aquí está mi tarjeta digital de lavados.",
      url: cardUrl,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(cardUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled the share sheet, or the API is unavailable — no-op.
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row">
      <Button
        variant="secondary"
        className="w-full"
        onClick={handleShare}
        aria-label="Compartir tarjeta"
      >
        {copied ? (
          <>
            <Check aria-hidden /> Enlace copiado
          </>
        ) : (
          <>
            <Share2 aria-hidden /> Compartir
          </>
        )}
      </Button>

      <a
        href={qrPngDataUrl}
        download={`tarjeta-${plate}.png`}
        className="w-full"
      >
        <Button variant="outline" className="w-full" tabIndex={-1}>
          <Download aria-hidden /> Descargar QR
        </Button>
      </a>
    </div>
  );
}
