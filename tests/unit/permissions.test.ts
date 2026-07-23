import { describe, expect, it } from "vitest";
import { can, permissionsFor, Permission } from "@/lib/permissions/roles";
import { MemberRole } from "@/types/domain";

describe("role permissions (§6)", () => {
  it("employee can register visits and redeem, but not manage program", () => {
    expect(can(MemberRole.Employee, Permission.RegisterVisit)).toBe(true);
    expect(can(MemberRole.Employee, Permission.RedeemReward)).toBe(true);
    expect(can(MemberRole.Employee, Permission.ManageProgram)).toBe(false);
    expect(can(MemberRole.Employee, Permission.ExportData)).toBe(false);
  });

  it("employee cannot reverse movements or view full customer", () => {
    expect(can(MemberRole.Employee, Permission.ReverseMovement)).toBe(false);
    expect(can(MemberRole.Employee, Permission.ViewCustomerFull)).toBe(false);
  });

  it("manager can reverse and view reports, but cannot export or manage program", () => {
    expect(can(MemberRole.Manager, Permission.ReverseMovement)).toBe(true);
    expect(can(MemberRole.Manager, Permission.ViewReports)).toBe(true);
    expect(can(MemberRole.Manager, Permission.ExportData)).toBe(false);
    expect(can(MemberRole.Manager, Permission.ManageProgram)).toBe(false);
  });

  it("owner can do everything managers can, plus program/export/config", () => {
    expect(can(MemberRole.Owner, Permission.ManageProgram)).toBe(true);
    expect(can(MemberRole.Owner, Permission.ExportData)).toBe(true);
    expect(can(MemberRole.Owner, Permission.ConfigureOrganization)).toBe(true);
    expect(can(MemberRole.Owner, Permission.InviteMembers)).toBe(true);
  });

  it("permissionsFor returns a non-empty list per role", () => {
    expect(permissionsFor(MemberRole.Employee).length).toBeGreaterThan(0);
    expect(permissionsFor(MemberRole.Owner).length).toBeGreaterThan(
      permissionsFor(MemberRole.Employee).length,
    );
  });
});
