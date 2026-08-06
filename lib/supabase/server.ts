import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 * Reads/writes the user session from cookies (RLS runs as the logged-in user).
 *
 * Memoized per-request with React `cache()`: every caller in the same request
 * shares ONE client instance, so the auth token is validated/refreshed once.
 * Creating several independent clients per request made each refresh the token
 * concurrently, and Supabase's refresh-token rotation would then invalidate the
 * session (logging the user out) — especially on the longer write paths.
 */
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Ignore spurious deletions of the auth session cookie. Concurrent
            // requests during a long action can race on refresh-token rotation:
            // one refresh writes the new session, the loser's failed refresh
            // tries to CLEAR the cookie (empty value / maxAge 0), which would log
            // the user out. A real refresh always writes a non-empty value, so we
            // drop only the clears. Genuine logout deletes cookies explicitly in
            // the logout action.
            const isAuthClear =
              name.includes("-auth-token") && (!value || options?.maxAge === 0);
            if (isAuthClear) return;
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component (read-only cookies). Safe to ignore:
          // the middleware refreshes the session on each request.
        }
      },
    },
  });
});
