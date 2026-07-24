import { customersCsv, visitsCsv } from "@/lib/loyalty/demo-store";

export const dynamic = "force-dynamic";

/**
 * CSV export endpoint (§15).
 *
 * NOTE (demo): not auth-gated and reads the in-memory store. In production this
 * must require an authenticated session, scope rows to the caller's
 * organization (RLS) and check the export permission.
 */
export function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");

  let csv: string;
  let filename: string;
  if (type === "visits") {
    csv = visitsCsv();
    filename = "visitas.csv";
  } else if (type === "customers") {
    csv = customersCsv();
    filename = "clientes.csv";
  } else {
    return new Response("Parámetro 'type' inválido (customers | visits).", {
      status: 400,
    });
  }

  // Prepend a UTF-8 BOM so Excel reads accents correctly.
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
