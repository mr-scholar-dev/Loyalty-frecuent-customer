"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  recoverySchema,
  type RecoveryInput,
} from "@/lib/validation/registration";
import { recover } from "@/actions/recovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELD_ERROR_CLASS = "text-xs font-medium text-destructive";

export function RecoveryForm({ slug }: { slug: string }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoveryInput>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { phone: "", licensePlate: "" },
  });

  function onSubmit(values: RecoveryInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await recover(slug, values);
      if (result && !result.ok) setFormError(result.message);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
        {isPending ? "Buscando…" : "Recuperar mi tarjeta"}
      </Button>
    </form>
  );
}
