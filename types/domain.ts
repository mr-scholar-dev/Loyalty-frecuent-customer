/**
 * Shared domain enums and types.
 *
 * These mirror the PostgreSQL enums that will be created in the (deferred)
 * database phase, so the application layer and the future schema stay in sync.
 * Defined as `const` objects + derived unions to keep them usable as runtime
 * values (e.g. for Zod) and as strict types — without TS `enum`.
 */

export const PlatformRole = {
  Superadmin: "superadmin",
} as const;
export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const MemberRole = {
  Owner: "owner",
  Manager: "manager",
  Employee: "employee",
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export const MemberStatus = {
  Invited: "invited",
  Active: "active",
  Disabled: "disabled",
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const OrganizationStatus = {
  Active: "active",
  Suspended: "suspended",
  Trial: "trial",
} as const;
export type OrganizationStatus =
  (typeof OrganizationStatus)[keyof typeof OrganizationStatus];

export const BranchStatus = {
  Active: "active",
  Inactive: "inactive",
} as const;
export type BranchStatus = (typeof BranchStatus)[keyof typeof BranchStatus];

export const CustomerStatus = {
  Active: "active",
  Blocked: "blocked",
  Archived: "archived",
} as const;
export type CustomerStatus =
  (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const VehicleStatus = {
  Active: "active",
  Inactive: "inactive",
} as const;
export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const ProgramType = {
  VisitCount: "visit_count",
} as const;
export type ProgramType = (typeof ProgramType)[keyof typeof ProgramType];

export const CycleBehavior = {
  RollingCycle: "rolling_cycle",
} as const;
export type CycleBehavior = (typeof CycleBehavior)[keyof typeof CycleBehavior];

export const ProgramStatus = {
  Draft: "draft",
  Active: "active",
  Inactive: "inactive",
} as const;
export type ProgramStatus = (typeof ProgramStatus)[keyof typeof ProgramStatus];

export const MembershipStatus = {
  Active: "active",
  Blocked: "blocked",
  Expired: "expired",
} as const;
export type MembershipStatus =
  (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const LoyaltyEventType = {
  VisitEarned: "visit_earned",
  VisitReversed: "visit_reversed",
  RewardEarned: "reward_earned",
  RewardRedeemed: "reward_redeemed",
  RewardReversed: "reward_reversed",
  ManualAdjustment: "manual_adjustment",
} as const;
export type LoyaltyEventType =
  (typeof LoyaltyEventType)[keyof typeof LoyaltyEventType];

export const RedemptionStatus = {
  Completed: "completed",
  Reversed: "reversed",
} as const;
export type RedemptionStatus =
  (typeof RedemptionStatus)[keyof typeof RedemptionStatus];
