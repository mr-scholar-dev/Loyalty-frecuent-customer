import { NextResponse, type NextRequest } from "next/server";

/**
 * Phase 0 middleware: pass-through only.
 *
 * Auth/session refresh, organization resolution and role gating are added in
 * Phase 2. Kept here so the wiring (matcher + entry point) exists from the
 * start without enforcing any policy yet.
 */
export function middleware(_request: NextRequest): NextResponse {
  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
