import { MembershipStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const STYLES: Record<MembershipStatus, string> = {
  [MembershipStatus.Active]: "bg-success/10 text-success",
  [MembershipStatus.Blocked]: "bg-destructive/10 text-destructive",
  [MembershipStatus.Expired]: "bg-muted text-muted-foreground",
};

const LABELS: Record<MembershipStatus, string> = {
  [MembershipStatus.Active]: "Activa",
  [MembershipStatus.Blocked]: "Bloqueada",
  [MembershipStatus.Expired]: "Expirada",
};

export function StatusBadge({ status }: { status: MembershipStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-xs font-medium",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
