import "server-only";
import { headers } from "next/headers";

/**
 * Lightweight fixed-window rate limiter (§12).
 *
 * IN-MEMORY / per-instance — good enough for a single Node instance and for
 * curbing casual abuse in dev/pilot. PRODUCTION at scale should back this with a
 * shared store (Upstash/Redis or a Postgres table) so limits hold across
 * serverless instances.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const globalForRl = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, Entry>;
};
const store: Map<string, Entry> =
  globalForRl.__rateLimitStore ??
  (globalForRl.__rateLimitStore = new Map<string, Entry>());

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  entry.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP from proxy headers (falls back to "unknown"). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return h.get("x-real-ip")?.trim() ?? "unknown";
}
