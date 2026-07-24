"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Ban,
  KeyRound,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { MembershipStatus } from "@/types/domain";
import {
  archiveCustomerAction,
  blockAction,
  reactivateAction,
  reissueAction,
  reverseVisitAction,
  unarchiveCustomerAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerActionsProps {
  membershipId: string;
  status: MembershipStatus;
  archived: boolean;
  canReverse: boolean;
}

export function CustomerActions({
  membershipId,
  status,
  archived,
  canReverse,
}: CustomerActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [reversing, setReversing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reissuedPath, setReissuedPath] = useState<string | null>(null);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const isBlocked = status === MembershipStatus.Blocked;

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  function doReissue() {
    setError(null);
    startTransition(async () => {
      const result = await reissueAction(membershipId);
      if (!result.ok) {
        setError("No se pudo reemitir la tarjeta.");
        return;
      }
      setReissuedPath(`/c/${result.newToken}`);
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
      const result = await reverseVisitAction(membershipId, reason);
      if (!result.ok) {
        setError(
          result.reason === "invalid_state"
            ? "No hay lavados en el ciclo para revertir."
            : result.reason === "not_authorized"
              ? "No tienes permiso para revertir."
              : "No se pudo revertir.",
        );
        return;
      }
      setReason("");
      setReversing(false);
      router.refresh();
    });
  }

  if (archived) {
    return (
      <div className="space-y-3">
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Cliente archivado. No aparece en la operación diaria y su tarjeta está
          inactiva.
        </p>
        <Button
          variant="secondary"
          onClick={() => run(() => unarchiveCustomerAction(membershipId))}
          disabled={isPending}
        >
          {isPending && <Loader2 className="animate-spin" aria-hidden />}
          <ArchiveRestore aria-hidden /> Desarchivar cliente
        </Button>
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {isBlocked ? (
          <Button
            variant="secondary"
            onClick={() => run(() => reactivateAction(membershipId))}
            disabled={isPending}
          >
            <ShieldCheck aria-hidden /> Reactivar tarjeta
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={() => run(() => blockAction(membershipId))}
            disabled={isPending}
          >
            <Ban aria-hidden /> Bloquear tarjeta
          </Button>
        )}

        <Button variant="outline" onClick={doReissue} disabled={isPending}>
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

        {!confirmingArchive && (
          <Button
            variant="outline"
            onClick={() => setConfirmingArchive(true)}
            disabled={isPending}
          >
            <Archive aria-hidden /> Archivar cliente
          </Button>
        )}
      </div>

      {confirmingArchive && (
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
          <p className="text-sm font-medium">
            ¿Archivar este cliente? Se ocultará de la operación y su tarjeta
            quedará inactiva (reversible).
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setConfirmingArchive(false);
                run(() => archiveCustomerAction(membershipId));
              }}
              disabled={isPending}
            >
              {isPending && <Loader2 className="animate-spin" aria-hidden />}
              Confirmar
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmingArchive(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {reissuedPath && (
        <div className="rounded-lg border bg-emerald-50 p-3 text-sm">
          <p className="font-medium text-emerald-700">
            Tarjeta reemitida. Comparte el nuevo enlace:
          </p>
          <a
            href={reissuedPath}
            target="_blank"
            rel="noreferrer"
            className="break-all font-medium text-primary underline underline-offset-2"
          >
            {reissuedPath}
          </a>
        </div>
      )}

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
