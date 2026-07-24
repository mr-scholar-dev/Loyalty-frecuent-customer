import { createClient } from "@/lib/supabase/server";
import { getActiveMembership } from "@/lib/supabase/auth";
import { customersCsv, visitsCsv } from "@/lib/loyalty/admin-queries";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/**
 * CSV export endpoint (§15). Requires an authenticated owner/manager (§6:
 * employees can't export). Queries run under RLS → rows scoped to the org.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("No autorizado.", { status: 401 });
  }

  const membership = await getActiveMembership();
  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return new Response("Sin permiso para exportar.", { status: 403 });
  }

  const ip = await getClientIp();
  if (!rateLimit(`export:${user.id}:${ip}`, 20, 10 * 60_000).ok) {
    return new Response("Demasiadas descargas. Espera unos minutos.", {
      status: 429,
    });
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
