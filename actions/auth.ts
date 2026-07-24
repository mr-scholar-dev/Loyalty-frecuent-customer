"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";

export interface LoginState {
  error?: string;
}

/** Email/password sign-in (Fase 2). Sets the session cookie via the server client. */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Ingresa correo y contraseña." };
  }

  // Throttle login attempts per IP (in addition to Supabase's own limits).
  const ip = await getClientIp();
  if (!rateLimit(`login:${ip}`, 10, 5 * 60_000).ok) {
    return { error: "Demasiados intentos. Espera unos minutos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Credenciales inválidas." };
  }
  redirect("/dashboard");
}

/** Sign out and return to the login page. */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
