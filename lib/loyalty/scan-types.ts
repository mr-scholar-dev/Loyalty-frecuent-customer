import type { MembershipStatus } from "@/types/domain";
import type { ProgressView } from "@/lib/loyalty/progress";

/** Staff-facing membership view (unmasked). Shared by the scan action + UI. */
export interface StaffMembershipView {
  membershipId: string;
  organizationName: string;
  customerFullName: string;
  licensePlate: string;
  status: MembershipStatus;
  progress: ProgressView;
  lastActivityAt: string | null;
}

export type MutationResult =
  | { ok: true; view: StaffMembershipView; rewardEarned?: boolean }
  | {
      ok: false;
      reason:
        "not_found" | "blocked" | "no_reward" | "not_authorized" | "error";
    };
