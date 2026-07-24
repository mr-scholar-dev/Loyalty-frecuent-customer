"use server";

import { redirect } from "next/navigation";
import {
  enrollmentSchema,
  type EnrollmentInput,
} from "@/lib/validation/registration";
import { normalizePlate } from "@/lib/normalization/plate";
import { getSampleOrg } from "@/lib/org/sample";
import { createDemoMembership } from "@/lib/loyalty/demo-store";

export interface EnrollmentError {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<keyof EnrollmentInput, string>>;
}

/**
 * Public enrollment (§10 Flujo B). Server-side validation is authoritative —
 * the client form validates for UX, but we never trust it. On success we create
 * a (demo) membership and redirect to the success screen.
 *
 * The organization is derived from the slug on the server, never from client
 * fields (§ multi-tenant invariants). Duplicate detection and transactional
 * persistence arrive with the database phase.
 */
export async function enroll(
  slug: string,
  input: EnrollmentInput,
): Promise<EnrollmentError> {
  const org = getSampleOrg(slug);
  if (!org) {
    return { ok: false, message: "Servicentro no encontrado." };
  }

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
  const normalizedPlate = normalizePlate(data.licensePlate).normalized;
  if (!normalizedPlate) {
    return {
      ok: false,
      message: "Placa inválida.",
      fieldErrors: { licensePlate: "Ingresa una placa válida" },
    };
  }

  // Server time, never the device (§12).
  const token = createDemoMembership({
    organization: org.brand,
    customerFullName: data.fullName,
    licensePlate: normalizedPlate,
    joinedAt: new Date().toISOString(),
  });

  redirect(`/${slug}/registro/exito?token=${token}`);
}
