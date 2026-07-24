import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseSecretKey } from "@/lib/supabase/env";

/**
 * SERVER-ONLY admin client using the secret key. Bypasses RLS.
 *
 * Use only for operations that legitimately run without a user session and that
 * cannot be expressed under RLS — e.g. public enrollment, card lookup by token
 * hash, or invoking transactional RPCs on the customer's behalf. Never import
 * this into a Client Component.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  return createSupabaseClient(url, getSupabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
