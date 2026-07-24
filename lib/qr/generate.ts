/**
 * QR generation (§7 stack: `qrcode`). Server-side helpers producing an inline
 * SVG (crisp display) and a PNG data URL (for download/share).
 */

import QRCode from "qrcode";

const QR_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 1,
};

/** Generate an SVG string for a value (transparent-friendly, scalable). */
export async function generateQrSvg(value: string): Promise<string> {
  return QRCode.toString(value, {
    ...QR_OPTIONS,
    type: "svg",
    width: 512,
  });
}

/** Generate a PNG data URL for a value (used for downloads). */
export async function generateQrPngDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    ...QR_OPTIONS,
    width: 1024,
  });
}

export interface QrAssets {
  svg: string;
  pngDataUrl: string;
}

/** Convenience: build both representations at once. */
export async function generateQrAssets(value: string): Promise<QrAssets> {
  const [svg, pngDataUrl] = await Promise.all([
    generateQrSvg(value),
    generateQrPngDataUrl(value),
  ]);
  return { svg, pngDataUrl };
}
