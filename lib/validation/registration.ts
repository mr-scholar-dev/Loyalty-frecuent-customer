/**
 * Zod schemas for the public enrollment form (§10 Flujo B).
 *
 * Validated at the input boundary (server action / API). Normalization of phone
 * and plate happens via the dedicated helpers so raw + normalized values are
 * both preserved downstream.
 */

import { z } from "zod";
import { isValidPhone } from "@/lib/normalization/phone";
import { isValidPlate } from "@/lib/normalization/plate";

export const enrollmentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(120, "El nombre es demasiado largo"),
  phone: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio")
    .refine((value) => isValidPhone(value), {
      message: "Ingresa un teléfono válido de Costa Rica",
    }),
  licensePlate: z
    .string()
    .trim()
    .min(1, "La placa es obligatoria")
    .refine((value) => isValidPlate(value), {
      message: "Ingresa una placa válida",
    }),
  email: z
    .string()
    .trim()
    .email("Correo inválido")
    .optional()
    .or(z.literal("")),
  marketingConsent: z.boolean().default(false),
  // Privacy consent is mandatory: must be explicitly true.
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de privacidad" }),
  }),
});

export type EnrollmentInput = z.input<typeof enrollmentSchema>;
export type EnrollmentData = z.output<typeof enrollmentSchema>;

/**
 * Schema for the card recovery form (§13): phone + plate only.
 * By privacy design the result must never reveal whether a person exists.
 */
export const recoverySchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio")
    .refine((value) => isValidPhone(value), {
      message: "Ingresa un teléfono válido de Costa Rica",
    }),
  licensePlate: z
    .string()
    .trim()
    .min(1, "La placa es obligatoria")
    .refine((value) => isValidPlate(value), {
      message: "Ingresa una placa válida",
    }),
});

export type RecoveryInput = z.input<typeof recoverySchema>;
export type RecoveryData = z.output<typeof recoverySchema>;
