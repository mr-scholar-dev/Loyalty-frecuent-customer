"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  enrollmentSchema,
  type EnrollmentInput,
} from "@/lib/validation/registration";
import { enroll } from "@/actions/enrollment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EnrollmentFormProps {
  slug: string;
}

const FIELD_ERROR_CLASS = "text-xs font-medium text-destructive";

export function EnrollmentForm({ slug }: EnrollmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EnrollmentInput>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      licensePlate: "",
      email: "",
      marketingConsent: false,
    },
  });

  function onSubmit(values: EnrollmentInput) {
    setFormError(null);
    startTransition(async () => {
      // On success the server action redirects; only failures return here.
      const result = await enroll(slug, values);
      if (result && !result.ok) {
        setFormError(result.message);
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof EnrollmentInput, { message });
          }
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className={FIELD_ERROR_CLASS}>{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          placeholder="8888-7777"
          autoComplete="tel"
          aria-invalid={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && (
          <p className={FIELD_ERROR_CLASS}>{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="licensePlate">Placa del vehículo</Label>
        <Input
          id="licensePlate"
          placeholder="ABC-123"
          autoCapitalize="characters"
          aria-invalid={!!errors.licensePlate}
          {...register("licensePlate")}
        />
        {errors.licensePlate && (
          <p className={FIELD_ERROR_CLASS}>{errors.licensePlate.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">
          Correo electrónico{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className={FIELD_ERROR_CLASS}>{errors.email.message}</p>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-input"
          {...register("marketingConsent")}
        />
        <span className="text-muted-foreground">
          Quiero recibir promociones y novedades.
        </span>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-input"
          aria-invalid={!!errors.privacyConsent}
          {...register("privacyConsent")}
        />
        <span className="text-muted-foreground">
          Acepto la{" "}
          <a
            href="/privacy"
            className="font-medium text-primary underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            política de privacidad
          </a>
          .
        </span>
      </label>
      {errors.privacyConsent && (
        <p className={FIELD_ERROR_CLASS}>{errors.privacyConsent.message}</p>
      )}

      {formError && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" aria-hidden />}
        {isPending ? "Creando tarjeta…" : "Crear mi tarjeta"}
      </Button>
    </form>
  );
}
