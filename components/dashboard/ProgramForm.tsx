"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { updateProgram } from "@/actions/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProgramFormProps {
  name: string;
  paidVisitsRequired: number;
  rewardQuantity: number;
  rewardName: string;
}

export function ProgramForm(props: ProgramFormProps) {
  const router = useRouter();
  const [name, setName] = useState(props.name);
  const [required, setRequired] = useState(String(props.paidVisitsRequired));
  const [quantity, setQuantity] = useState(String(props.rewardQuantity));
  const [rewardName, setRewardName] = useState(props.rewardName);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function save() {
    setMessage(null);
    setOk(false);
    startTransition(async () => {
      const result = await updateProgram({
        name,
        paidVisitsRequired: Number(required),
        rewardQuantity: Number(quantity),
        rewardName,
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
        <Label htmlFor="prog-name">Nombre del programa</Label>
        <Input
          id="prog-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="required">Lavados pagados requeridos</Label>
          <Input
            id="required"
            type="number"
            min={1}
            value={required}
            onChange={(e) => setRequired(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Recompensas por ciclo</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reward-name">Nombre de la recompensa</Label>
        <Input
          id="reward-name"
          value={rewardName}
          onChange={(e) => setRewardName(e.target.value)}
        />
      </div>

      <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        Regla: {required || "?"} lavados pagados generan {quantity || "?"}{" "}
        {rewardName || "recompensa"}.
      </p>

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
        Guardar programa
      </Button>
    </div>
  );
}
