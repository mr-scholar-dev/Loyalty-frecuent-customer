import { NextResponse } from "next/server";

// Health check must never be cached so probes see live status.
export const dynamic = "force-dynamic";

/**
 * Liveness/health endpoint used by deploy platforms and uptime checks.
 * Intentionally returns no sensitive information.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "loyalty-web",
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
    timestamp: new Date().toISOString(),
  });
}
