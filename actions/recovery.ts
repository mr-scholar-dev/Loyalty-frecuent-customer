"use server";

import { redirect } from "next/navigation";
import {
  recoverySchema,
  type RecoveryInput,
} from "@/lib/validation/registration";
import { normalizePhone } from "@/lib/normalization/phone";
import { normalizePlate } from "@/lib/normalization/plate";
import { recoverMembership } from "@/lib/loyalty/queries";

export interface RecoveryError {
  ok: false;
  message: string;
}

/**
 * Public card recovery (§13). Validates on the server, matches by phone + plate
 * and (on success) redirects to the freshly reissued card. Messages avoid
 * confirming whether a person exists beyond what's needed for self-service.
 */
export async function recover(
  slug: string,
  input: RecoveryInput,
): Promise<RecoveryError> {
  const parsed = recoverySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa el teléfono y la placa." };
  }

  const phone = normalizePhone(parsed.data.phone);
  const plate = normalizePlate(parsed.data.licensePlate);
  if (!phone.normalized || !plate.normalized) {
    return { ok: false, message: "Teléfono o placa inválidos." };
  }

  const result = await recoverMembership({
    slug,
    phoneNormalized: phone.normalized,
    plateNormalized: plate.normalized,
  });

  if (!result.ok) {
    if (result.reason === "blocked") {
      return {
        ok: false,
        message:
          "Esa tarjeta está bloqueada. Acércate al servicentro para reactivarla.",
      };
    }
    return {
      ok: false,
      message:
        "No encontramos una tarjeta con esos datos. Verifica el teléfono y la placa, o acércate al servicentro.",
    };
  }

  redirect(`/c/${result.token}`);
}
