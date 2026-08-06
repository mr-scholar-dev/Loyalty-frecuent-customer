/** Shared site/contact constants. */
export const CONTACT_PHONE = "+506 6151 1306";
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "50661511306";
const WHATSAPP_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
  "¿Cuáles son los métodos de pago? Me interesa activar el Plan Pro de $65 USD.";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

/** Pro plan pricing (USD). */
export const PRO_PRICE_USD = 65; // por mes
export const PRO_PRICE_USD_ANNUAL = 54; // por mes, facturado anual
export const PRO_PRICE_USD_ANNUAL_TOTAL = 648; // cobro único al año ($54 × 12)
export const PRO_ANNUAL_SAVINGS_PCT = 17; // ahorro anual vs mensual
