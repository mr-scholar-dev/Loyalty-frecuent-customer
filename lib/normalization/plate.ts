/**
 * License plate normalization (§8).
 *
 * Uppercases and removes spaces/dashes, keeping only alphanumerics. The plate
 * is NEVER used as a public token (§9); it is only a normalized business key
 * unique per organization.
 */

export interface NormalizedPlate {
  raw: string;
  /** Uppercase alphanumerics only, or null when empty after cleaning. */
  normalized: string | null;
  valid: boolean;
}

const MIN_PLATE_LENGTH = 2;
const MAX_PLATE_LENGTH = 12;

/**
 * Normalize a license plate.
 *
 * Examples:
 *   "ABC-123" -> "ABC123"
 *   "abc 123" -> "ABC123"
 */
export function normalizePlate(raw: string): NormalizedPlate {
  const cleaned = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  const valid =
    cleaned.length >= MIN_PLATE_LENGTH && cleaned.length <= MAX_PLATE_LENGTH;

  return {
    raw,
    normalized: cleaned.length > 0 ? cleaned : null,
    valid,
  };
}

/** True when the input normalizes to a plausible plate. */
export function isValidPlate(raw: string): boolean {
  return normalizePlate(raw).valid;
}
