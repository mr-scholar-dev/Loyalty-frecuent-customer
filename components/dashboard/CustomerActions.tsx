"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, KeyRound, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { MembershipStatus } from "@/types/domain";
import {
  blockAction,
  reactivateAction,
  reissueAction,
  reverseVisitAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerActionsProps {
  token: string;
  status: MembershipStatus;
  canReverse: boolean;
}

export function CustomerActions({
  token,
  status,
  canReverse,
}: CustomerActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [reversing, setReversing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBlocked = status === MembershipStatus.Blocked;

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  function doReverse() {
    if (!reason.trim()) {
      setError("El motivo es obligatorio.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await reverseVisitAction(token, reason);
      if (!result.ok) {
        setError(
          result.reason === "invalid_state"
            ? "No hay lavados en el ciclo para revertir."
            : "No se pudo revertir.",
        );
        return;
      }
      setReason("");
      setReversing(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {isBlocked ? (
          <Button
            variant="secondary"
            onClick={() => run(() => reactivateAction(token))}
            disabled={isPending}
          >
            <ShieldCheck aria-hidden /> Reactivar tarjeta
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={() => run(() => blockAction(token))}
            disabled={isPending}
          >
            <Ban aria-hidden /> Bloquear tarjeta
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => run(() => reissueAction(token))}
          disabled={isPending}
        >
          <KeyRound aria-hidden /> Reemitir tarjeta
        </Button>

        {!reversing && (
          <Button
            variant="outline"
            onClick={() => setReversing(true)}
            disabled={isPending || !canReverse}
          >
            <RotateCcw aria-hidden /> Revertir último lavado
          </Button>
        )}
      </div>

      {reversing && (
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
          <Label htmlFor="reverse-reason">Motivo de la reversión</Label>
          <Input
            id="reverse-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej.: registrado por error"
          />
          <div className="flex gap-2">
            <Button onClick={doReverse} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" aria-hidden />}
              Confirmar reversión
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setReversing(false);
                setReason("");
                setError(null);
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
