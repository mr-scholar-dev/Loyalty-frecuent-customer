/**
 * Supabase environment accessors. Fail loudly if misconfigured.
 *
 * Uses the current Supabase key scheme:
 *   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (browser-safe, like the old anon key)
 *   - SUPABASE_SECRET_KEY                   (server-only, like the old service_role)
 */

export function getSupabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url, publishableKey };
}

/** Server-only. Never expose to the browser. */
export function getSupabaseSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error("Falta SUPABASE_SECRET_KEY (solo servidor).");
  }
  return key;
}
