"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";

/**
 * Self-serve onboarding (§ registro de socios). A car-wash owner creates their
 * business from the public /registro page. The organization starts as `trial`
 * (registered, awaiting payment) — the dashboard is locked behind the activation
 * screen until the subscription is paid (status → active), either via Stripe or
 * a superadmin. Everything is provisioned with the admin client because a brand
 * new user has no membership yet and so cannot pass RLS to create their own org.
 */

export interface RegisterState {
  error?: string;
}

const registerSchema = z.object({
  businessName: z.string().trim().min(2, "Nombre del negocio muy corto").max(120),
  ownerName: z.string().trim().min(2, "Ingresa tu nombre").max(120),
  email: z.string().trim().email("Correo inválido").max(160),
  phone: z.string().trim().min(6, "Teléfono inválido").max(30),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "servicentro";
}

async function uniqueSlug(
  admin: SupabaseClient,
  base: string,
): Promise<string> {
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const { data } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function registerOrganization(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    businessName: formData.get("businessName"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { businessName, ownerName, email, phone, password } = parsed.data;

  // Throttle sign-ups per IP.
  const ip = await getClientIp();
  if (!rateLimit(`register:${ip}`, 5, 10 * 60_000).ok) {
    return { error: "Demasiados intentos. Espera unos minutos." };
  }

  const admin = createAdminClient();

  // 1) Auth user (auto-confirmed so they can sign in immediately).
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: ownerName },
  });
  if (userErr || !created?.user) {
    const msg = userErr?.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { error: "Ya existe una cuenta con ese correo. Inicia sesión." };
    }
    return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
  }
  const userId = created.user.id;

  // 2) Organization (trial = registrada, pendiente de pago).
  const slug = await uniqueSlug(admin, slugify(businessName));
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: businessName, slug, status: "trial" })
    .select("id")
    .single();
  if (orgErr || !org) {
    await admin.auth.admin.deleteUser(userId); // roll back the orphan user
    return { error: "No se pudo crear el negocio. Intenta de nuevo." };
  }

  // 3) Profile + owner membership (both critical).
  await admin.from("profiles").insert({
    id: userId,
    full_name: ownerName,
    phone,
  });
  const { error: memberErr } = await admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "owner",
    status: "active",
  });
  if (memberErr) {
    await admin.from("organizations").delete().eq("id", org.id);
    await admin.auth.admin.deleteUser(userId);
    return { error: "No se pudo completar el registro. Intenta de nuevo." };
  }

  // 4) Sensible defaults so the app is usable the moment they activate.
  //    Non-critical: if these fail the owner can create them in Settings.
  await admin.from("branches").insert({
    organization_id: org.id,
    name: "Sucursal principal",
    code: "PRINCIPAL",
    status: "active",
  });
  await admin.from("loyalty_programs").insert({
    organization_id: org.id,
    name: "Programa de lavados",
    program_type: "visit_count",
    paid_visits_required: 9,
    reward_quantity: 1,
    reward_name: "Lavado gratis",
    cycle_behavior: "rolling_cycle",
    status: "active",
  });

  // 5) Sign them in (sets the session cookie) and send to the activation screen.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    // Account exists; just send them to log in manually.
    redirect("/login");
  }
  redirect("/activar");
}
