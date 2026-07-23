/**
 * Public membership token handling (§9) — SERVER ONLY (uses node:crypto).
 *
 * The token embedded in the QR / card URL (`/c/{token}`) must be high-entropy,
 * unguessable, non-sequential, and revocable. We store only a keyed hash plus a
 * short non-secret prefix for support lookups — never the raw token when
 * avoidable. The plaintext token is shown once to the customer and lives in
 * their URL thereafter.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Bytes of entropy for a public token (32 bytes => 256 bits). */
const TOKEN_BYTES = 32;
/** Length of the non-secret prefix kept for support/debugging. */
export const TOKEN_PREFIX_LENGTH = 8;

/** Generate a URL-safe, high-entropy public token. */
export function generatePublicToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Non-secret prefix of a token, safe to store for support lookups. */
export function tokenPrefix(token: string): string {
  return token.slice(0, TOKEN_PREFIX_LENGTH);
}

function resolveSecret(secret?: string): string {
  const value = secret ?? process.env.TOKEN_HASH_SECRET;
  if (!value) {
    throw new Error(
      "TOKEN_HASH_SECRET is not set; cannot hash public tokens securely.",
    );
  }
  return value;
}

/** Keyed hash (HMAC-SHA256, hex) of a token for storage/comparison. */
export function hashToken(token: string, secret?: string): string {
  return createHmac("sha256", resolveSecret(secret))
    .update(token)
    .digest("hex");
}

/**
 * Constant-time comparison of a presented token against a stored hash.
 * Returns false on any length/format mismatch rather than throwing.
 */
export function verifyToken(
  token: string,
  storedHash: string,
  secret?: string,
): boolean {
  const computed = hashToken(token, secret);
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length || a.length === 0) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export interface IssuedToken {
  /** Plaintext token — return to the customer, do not persist in cleartext. */
  token: string;
  /** Keyed hash to store. */
  hash: string;
  /** Non-secret prefix to store for support. */
  prefix: string;
}

/** Create a fresh token bundle ready to persist (hash + prefix) and share. */
export function issuePublicToken(secret?: string): IssuedToken {
  const token = generatePublicToken();
  return {
    token,
    hash: hashToken(token, secret),
    prefix: tokenPrefix(token),
  };
}
