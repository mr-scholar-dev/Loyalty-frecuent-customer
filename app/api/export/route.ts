import { createClient } from "@/lib/supabase/server";
import { customersCsv, visitsCsv } from "@/lib/loyalty/admin-queries";

export const dynamic = "force-dynamic";

/**
 * CSV export endpoint (§15). Requires an authenticated session; the underlying
 * queries run under RLS, so rows are scoped to the caller's organization.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("No autorizado.", { status: 401 });
  }

  const type = new URL(request.url).searchParams.get("type");
  let csv: string;
  let filename: string;
  if (type === "visits") {
    csv = await visitsCsv();
    filename = "visitas.csv";
  } else if (type === "customers") {
    csv = await customersCsv();
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
