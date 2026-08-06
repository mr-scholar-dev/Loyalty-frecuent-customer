/**
 * Role-based permissions (§6) — pure policy, database-free.
 *
 * This is the SINGLE frontend/business-logic source of truth for what each
 * role may do. It is a convenience/UX layer only: the authoritative enforcement
 * lives in PostgreSQL RLS + RPC (deferred). Never trust this layer for security
 * decisions on its own (§ rule 9).
 */

import { MemberRole } from "@/types/domain";

export const Permission = {
  ScanCard: "scan_card",
  ViewCustomerMinimal: "view_customer_minimal",
  ViewCustomerFull: "view_customer_full",
  RegisterVisit: "register_visit",
  RedeemReward: "redeem_reward",
  ReverseMovement: "reverse_movement",
  ViewReports: "view_reports",
  ExportData: "export_data",
  ManageProgram: "manage_program",
  ManageBranches: "manage_branches",
  InviteMembers: "invite_members",
  BlockMembership: "block_membership",
  ReissueCard: "reissue_card",
  ConfigureOrganization: "configure_organization",
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

/**
 * Permission matrix per organization role.
 * Owner is a superset of manager, which is a superset of employee — but we list
 * each explicitly to keep the policy auditable rather than relying on ordering.
 */
const ROLE_PERMISSIONS: Record<MemberRole, ReadonlySet<Permission>> = {
  [MemberRole.Employee]: new Set<Permission>([
    Permission.ScanCard,
    Permission.ViewCustomerMinimal,
    Permission.RegisterVisit,
    Permission.RedeemReward,
  ]),
  [MemberRole.Manager]: new Set<Permission>([
    Permission.ScanCard,
    Permission.ViewCustomerMinimal,
    Permission.ViewCustomerFull,
    Permission.RegisterVisit,
    Permission.RedeemReward,
    Permission.ReverseMovement,
    Permission.ViewReports,
    Permission.BlockMembership,
    Permission.ReissueCard,
  ]),
  [MemberRole.Owner]: new Set<Permission>([
    Permission.ScanCard,
    Permission.ViewCustomerMinimal,
    Permission.ViewCustomerFull,
    Permission.RegisterVisit,
    Permission.RedeemReward,
    Permission.ReverseMovement,
    Permission.ViewReports,
    Permission.ExportData,
    Permission.ManageProgram,
    Permission.ManageBranches,
    Permission.InviteMembers,
    Permission.BlockMembership,
    Permission.ReissueCard,
    Permission.ConfigureOrganization,
  ]),
};

/**
 * Narrow a role coming from the database (typed as plain text) to MemberRole.
 * Anything unrecognized falls back to the least-privileged role, so a bad or
 * future value can never widen access.
 */
export function toMemberRole(value: string | null | undefined): MemberRole {
  return value === MemberRole.Owner || value === MemberRole.Manager
    ? value
    : MemberRole.Employee;
}

/** Whether a given organization role holds a permission. */
export function can(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/** All permissions granted to a role (as an array, for UI listing). */
export function permissionsFor(role: MemberRole): Permission[] {
  return Array.from(ROLE_PERMISSIONS[role] ?? []);
}
