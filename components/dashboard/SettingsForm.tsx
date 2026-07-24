"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { updateOrgSettings } from "@/actions/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsFormProps {
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

export function SettingsForm({
  name: initialName,
  primaryColor: initialPrimary,
  secondaryColor: initialSecondary,
}: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [primary, setPrimary] = useState(initialPrimary);
  const [secondary, setSecondary] = useState(initialSecondary);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function save() {
    setMessage(null);
    setOk(false);
    startTransition(async () => {
      const result = await updateOrgSettings({
        name,
        primaryColor: primary,
        secondaryColor: secondary,
      });
      if (result.ok) {
        setOk(true);
        router.refresh();
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Nombre comercial</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="primary">Color primario</Label>
          <div className="flex items-center gap-2">
            <input
              id="primary"
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded border border-input"
            />
            <Input
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="secondary">Color secundario</Label>
          <div className="flex items-center gap-2">
            <input
              id="secondary"
              type="color"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded border border-input"
            />
            <Input
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div
        className="rounded-xl p-4 text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})`,
        }}
      >
        <p className="text-sm font-semibold">{name || "Servicentro"}</p>
        <p className="text-xs text-white/80">Vista previa de la tarjeta</p>
      </div>

      {message && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {message}
        </p>
      )}
      {ok && (
        <p className="flex items-center gap-1 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" aria-hidden /> Guardado
        </p>
      )}

      <Button onClick={save} disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" aria-hidden />}
        Guardar cambios
      </Button>
    </div>
  );
}
