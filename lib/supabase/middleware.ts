import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Refreshes the Supabase auth session on each request and syncs cookies.
 * Called from the root middleware. Does NOT gate routes yet — access control
 * for the dashboard is added once the login flow exists (Fase 2).
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Drop spurious clears of the auth session cookie (refresh-token
        // rotation races between concurrent requests would otherwise log the
        // user out). Real refreshes write a non-empty value and pass through.
        const safe = cookiesToSet.filter(
          ({ name, value, options }) =>
            !(
              name.includes("-auth-token") &&
              (!value || options?.maxAge === 0)
            ),
        );
        safe.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        safe.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: use getUser() (revalidates the token), not getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate the dashboard — but only redirect when the user is TRULY logged out
  // (no Supabase auth cookie present). getUser() can transiently return null
  // during a token refresh/rotation; bouncing to /login in that case logs the
  // user out mid-work. When a session cookie exists we let the request through
  // (RLS is the real security boundary) and the session recovers next request.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token"));

  if (
    !user &&
    !hasAuthCookie &&
    request.nextUrl.pathname.startsWith("/dashboard")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    // Preserve any refreshed cookies on the redirect.
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c);
    });
    return redirectResponse;
  }

  return response;
}
