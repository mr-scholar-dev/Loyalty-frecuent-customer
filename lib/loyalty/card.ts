/**
 * Public loyalty-card view model (§9, §16) — the SAFE projection shown at
 * `/c/{token}`. It must never expose full phone/email, admin history, internal
 * notes or employee data. Pure helpers only (no DB).
 */

import type { MembershipStatus } from "@/types/domain";
import { getProgressView, type ProgressView } from "@/lib/loyalty/progress";

/**
 * Mask a customer's name for public display: first name in full, surname
 * reduced to its initial plus bullets (§9 "apellido parcialmente oculto").
 *
 *   "María Rodríguez Solano" -> "María R•••••"
 *   "Carlos"                  -> "Carlos"
 */
export function maskCustomerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (first === undefined) return "";
  const surname = parts[1];
  if (surname === undefined) return first;
  const initial = surname.charAt(0).toUpperCase();
  const bullets = "•".repeat(Math.min(Math.max(surname.length - 1, 1), 6));
  return `${first} ${initial}${bullets}`;
}

/** Absolute URL for a membership card, used inside the QR code. */
export function buildCardUrl(token: string, appUrl?: string): string {
  const base = (
    appUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}/c/${token}`;
}

export interface OrganizationBrand {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

/** Everything the public card component needs — nothing sensitive. */
export interface CardView {
  organization: OrganizationBrand;
  /** Already masked for display. */
  customerDisplayName: string;
  /** Normalized plate (safe to show per §9). */
  licensePlate: string;
  status: MembershipStatus;
  progress: ProgressView;
  /** Public card URL (encoded in the QR). */
  cardUrl: string;
  /** ISO timestamp of last activity, or null. */
  lastActivityAt: string | null;
}

/** Format an ISO timestamp for Costa Rica display, or a fallback dash. */
export function formatLastActivity(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Costa_Rica",
  }).format(date);
}

export { getProgressView };
