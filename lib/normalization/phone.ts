/**
 * Phone normalization (§8).
 *
 * Keeps the original raw value and produces a canonical E.164-style value.
 * Defaults to Costa Rica (+506, 8 national digits) when no country code is
 * present. The default country is a parameter so other markets can be added
 * later without changing call sites.
 */

export const DEFAULT_COUNTRY_CODE = "506";
const CR_NATIONAL_LENGTH = 8;

export interface NormalizedPhone {
  /** Value exactly as entered by the user. */
  raw: string;
  /** Canonical form, e.g. "+50688887777", or null when it can't be normalized. */
  normalized: string | null;
  /** Whether the input produced a valid Costa Rica number. */
  valid: boolean;
}

/** Strip everything except digits and a single leading "+". */
function stripFormatting(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normalize a phone number.
 *
 * Examples (default CR):
 *   "8888-7777"     -> "+50688887777"
 *   "+506 8888 7777"-> "+50688887777"
 *   "50688887777"   -> "+50688887777"
 */
export function normalizePhone(
  raw: string,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): NormalizedPhone {
  const cleaned = stripFormatting(raw ?? "");
  const digits = cleaned.replace(/\D/g, "");

  let national: string | null = null;

  if (cleaned.startsWith("+")) {
    // Explicit country code provided.
    if (digits.startsWith(countryCode)) {
      national = digits.slice(countryCode.length);
    }
  } else if (
    digits.startsWith(countryCode) &&
    digits.length > CR_NATIONAL_LENGTH
  ) {
    national = digits.slice(countryCode.length);
  } else {
    national = digits;
  }

  const valid = national !== null && national.length === CR_NATIONAL_LENGTH;

  return {
    raw,
    normalized: valid ? `+${countryCode}${national}` : null,
    valid,
  };
}

/** True when the input normalizes to a valid number for the given country. */
export function isValidPhone(
  raw: string,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): boolean {
  return normalizePhone(raw, countryCode).valid;
}
