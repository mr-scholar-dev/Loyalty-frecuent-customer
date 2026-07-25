"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Gift,
  Loader2,
  Search,
  ShieldAlert,
  Trophy,
  XCircle,
} from "lucide-react";
import type {
  MutationResult,
  StaffMembershipView,
} from "@/lib/loyalty/scan-types";
import {
  lookupMembership,
  registerVisitAction,
  redeemRewardAction,
} from "@/actions/scan";
import { MembershipStatus } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressDots } from "@/components/loyalty-card/ProgressDots";
import { CameraScanner } from "@/components/scanner/CameraScanner";

type Receipt = {
  kind: "success" | "error";
  message: string;
  celebrate?: boolean;
};
type PendingAction = "visit" | "redeem" | null;

const ERROR_MESSAGES: Record<
  Extract<MutationResult, { ok: false }>["reason"],
  string
> = {
  not_found: "No se encontró la membresía.",
  blocked: "La tarjeta está bloqueada.",
  no_reward: "No hay recompensas disponibles para canjear.",
  not_authorized: "No tienes permiso para esta operación.",
  error: "No se pudo completar la operación.",
};

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

export function ScanConsole() {
  const [value, setValue] = useState("");
  const [view, setView] = useState<StaffMembershipView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [confirming, setConfirming] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  function doLookup(raw: string) {
    const query = raw.trim();
    if (!query) return;
    setReceipt(null);
    setConfirming(null);
    startTransition(async () => {
      const result = await lookupMembership(query);
      setView(result);
      setNotFound(result === null);
    });
  }

  function runAction(action: PendingAction) {
    if (!view || !action) return;
    const key = newIdempotencyKey();
    const membershipId = view.membershipId;
    setConfirming(null);
    startTransition(async () => {
      const result: MutationResult =
        action === "visit"
          ? await registerVisitAction(membershipId, key)
          : await redeemRewardAction(membershipId, key);

      if (result.ok) {
        setView(result.view);
        const rewardMoment =
          action === "redeem" || (action === "visit" && result.rewardEarned);
        setReceipt({
          kind: "success",
          celebrate: rewardMoment,
          message:
            action === "visit"
              ? result.rewardEarned
                ? "¡Recompensa desbloqueada!"
                : `Lavado registrado. Progreso ${result.view.progress.current}/${result.view.progress.required}.`
              : "Recompensa canjeada",
        });
      } else {
        setReceipt({ kind: "error", message: ERROR_MESSAGES[result.reason] });
      }
    });
  }

  const isBlocked = view?.status === MembershipStatus.Blocked;

  return (
    <div className="space-y-5">
      {/* Lookup */}
      <div className="space-y-2">
        <Label htmlFor="scan-input">Token o enlace de la tarjeta</Label>
        <div className="flex gap-2">
          <Input
            id="scan-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doLookup(value);
            }}
            placeholder="/c/… o pega el token"
            autoComplete="off"
            autoFocus
            enterKeyHint="search"
          />
          <Button
            onClick={() => doLookup(value)}
            disabled={isPending || !value.trim()}
            aria-label="Buscar tarjeta"
          >
            {isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Search aria-hidden />
            )}
          </Button>
        </div>
        <CameraScanner
          onResult={(scanned) => {
            setValue(scanned);
            doLookup(scanned);
          }}
        />
      </div>

      {notFound && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          No se encontró ninguna tarjeta con ese código.
        </p>
      )}

      {/* Result */}
      {view && (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {view.organizationName}
              </p>
              <p className="text-lg font-bold">{view.customerFullName}</p>
              <p className="text-sm text-muted-foreground">
                {view.licensePlate}
              </p>
            </div>
            <span
              className={
                isBlocked
                  ? "rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
                  : "rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
              }
            >
              {isBlocked ? "Bloqueada" : "Activa"}
            </span>
          </div>

          <div className="space-y-2 rounded-lg bg-muted/40 p-3">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{view.progress.progressLabel}</span>
              <span className="text-muted-foreground">
                {view.progress.remainingLabel}
              </span>
            </div>
            <div className="text-foreground">
              <ProgressDotsDark
                current={view.progress.current}
                required={view.progress.required}
              />
            </div>
            {view.progress.availableRewards > 0 && (
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-success">
                <Gift className="h-4 w-4" aria-hidden />
                {view.progress.availableRewards} recompensa(s) disponible(s)
              </p>
            )}
          </div>

          {isBlocked ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4" aria-hidden />
              No se pueden registrar operaciones en una tarjeta bloqueada.
            </p>
          ) : confirming ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {confirming === "visit"
                  ? "¿Registrar un lavado pagado?"
                  : "¿Canjear un lavado gratis?"}
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => runAction(confirming)}
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="animate-spin" aria-hidden />
                  )}
                  Confirmar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirming(null)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() => setConfirming("visit")}
                disabled={isPending}
              >
                Registrar lavado
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirming("redeem")}
                disabled={isPending || view.progress.availableRewards < 1}
              >
                Canjear recompensa
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Receipt */}
      {receipt &&
        (receipt.celebrate ? (
          <div
            role="status"
            className="animate-pop flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.06] px-4 py-6 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Trophy className="h-6 w-6" aria-hidden />
            </span>
            <p className="text-base font-semibold text-primary">
              {receipt.message}
            </p>
            <p className="text-sm text-muted-foreground">
              {receipt.message.includes("desbloqueada")
                ? "El cliente ya puede canjear su lavado gratis."
                : "Lavado gratis entregado al cliente."}
            </p>
          </div>
        ) : (
          <p
            role="status"
            className={
              receipt.kind === "success"
                ? "flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm font-medium text-success"
                : "flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
            }
          >
            {receipt.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : (
              <XCircle className="h-4 w-4" aria-hidden />
            )}
            {receipt.message}
          </p>
        ))}
    </div>
  );
}

/** Progress dots on a light background (staff panel). */
function ProgressDotsDark({
  current,
  required,
}: {
  current: number;
  required: number;
}) {
  return (
    <div className="rounded-md bg-primary p-2">
      <ProgressDots current={current} required={required} />
    </div>
  );
}
