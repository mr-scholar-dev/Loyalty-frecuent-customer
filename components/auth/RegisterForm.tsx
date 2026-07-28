"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  registerOrganization,
  type RegisterState,
} from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerOrganization,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="businessName">Nombre del servicentro</Label>
        <Input
          id="businessName"
          name="businessName"
          required
          autoComplete="organization"
          placeholder="Auto Lavado El Sol"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ownerName">Tu nombre</Label>
        <Input
          id="ownerName"
          name="ownerName"
          required
          autoComplete="name"
          placeholder="Nombre y apellido"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tucorreo@servicentro.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">WhatsApp / teléfono</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="8888-7777"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {pending ? "Creando tu cuenta…" : "Crear mi cuenta"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Sin tarjeta para registrarte. Activás tu plan para empezar a usar la app.
      </p>
    </form>
  );
}
