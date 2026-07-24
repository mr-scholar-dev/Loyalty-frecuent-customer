import { LoyaltyEventType } from "@/types/domain";

/** Spanish labels for ledger event types. */
export const EVENT_LABELS: Record<LoyaltyEventType, string> = {
  [LoyaltyEventType.VisitEarned]: "Lavado registrado",
  [LoyaltyEventType.VisitReversed]: "Lavado revertido",
  [LoyaltyEventType.RewardEarned]: "Recompensa generada",
  [LoyaltyEventType.RewardRedeemed]: "Recompensa canjeada",
  [LoyaltyEventType.RewardReversed]: "Recompensa revertida",
  [LoyaltyEventType.ManualAdjustment]: "Ajuste manual",
};

/** Format an ISO timestamp for Costa Rica display. */
export function formatDateTimeCR(iso: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Costa_Rica",
  }).format(new Date(iso));
}
