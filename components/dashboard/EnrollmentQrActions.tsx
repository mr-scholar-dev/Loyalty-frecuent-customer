"use client";

import { useState } from "react";
import { Check, Copy, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnrollmentQrActionsProps {
  url: string;
  qrPngDataUrl: string;
  slug: string;
}

/** Copy the enrollment link, download the QR image, or print the poster. */
export function EnrollmentQrActions({
  url,
  qrPngDataUrl,
  slug,
}: EnrollmentQrActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" onClick={copy}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copiado" : "Copiar enlace"}
      </Button>
      <a href={qrPngDataUrl} download={`qr-registro-${slug}.png`}>
        <Button variant="outline" tabIndex={-1}>
          <Download aria-hidden /> Descargar QR
        </Button>
      </a>
      <Button variant="outline" onClick={() => window.print()}>
        <Printer aria-hidden /> Imprimir
      </Button>
    </div>
  );
}
