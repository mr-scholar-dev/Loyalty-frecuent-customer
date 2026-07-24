"use server";

import { redirect } from "next/navigation";
import {
  enrollmentSchema,
  type EnrollmentInput,
} from "@/lib/validation/registration";
import { normalizePlate } from "@/lib/normalization/plate";
import { normalizePhone } from "@/lib/normalization/phone";
import { enrollCustomer } from "@/lib/loyalty/queries";

export interface EnrollmentError {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<keyof EnrollmentInput, string>>;
}

/**
 * Public enrollment (§10 Flujo B). Server-side validation is authoritative —
 * the client form validates for UX, but we never trust it.
 *
 * The organization is derived from the slug on the server, never from client
 * fields (§ multi-tenant invariants). Persists to Supabase (admin client, no
 * user session) and redirects to the success screen with the plaintext token.
 */
export async function enroll(
  slug: string,
  input: EnrollmentInput,
): Promise<EnrollmentError> {
  const parsed = enrollmentSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Partial<Record<keyof EnrollmentInput, string>> = {};
    for (const [key, messages] of Object.entries(flat)) {
      const first = messages?.[0];
      if (first) fieldErrors[key as keyof EnrollmentInput] = first;
    }
    return { ok: false, message: "Revisa los datos ingresados.", fieldErrors };
  }

  const data = parsed.data;
  const phone = normalizePhone(data.phone);
  const plate = normalizePlate(data.licensePlate);
  if (!phone.normalized || !plate.normalized) {
    return {
      ok: false,
      message: "Teléfono o placa inválidos.",
    };
  }

  const result = await enrollCustomer({
    slug,
    fullName: data.fullName,
    phoneRaw: data.phone,
    phoneNormalized: phone.normalized,
    plateRaw: data.licensePlate,
    plateNormalized: plate.normalized,
    email: data.email ? data.email : null,
    marketingConsent: data.marketingConsent,
  });

  if (!result.ok) {
    switch (result.reason) {
      case "org_not_found":
        return { ok: false, message: "Servicentro no encontrado." };
      case "no_program":
        return {
          ok: false,
          message: "Este servicentro no tiene un programa activo todavía.",
        };
      case "duplicate_plate":
        return {
          ok: false,
          message:
            "Ya existe una tarjeta con esa placa. Usa la recuperación de tarjeta.",
          fieldErrors: { licensePlate: "Placa ya registrada" },
        };
      default:
        return {
          ok: false,
          message: "No se pudo completar el registro. Intenta de nuevo.",
        };
    }
  }

  redirect(`/${slug}/registro/exito?token=${result.token}`);
}
