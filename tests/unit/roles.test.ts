import { describe, expect, it } from "vitest";
import { can, Permission, toMemberRole } from "@/lib/permissions/roles";
import { MemberRole } from "@/types/domain";

/**
 * `toMemberRole` narrows the role column (plain text in the database) before it
 * gates anything — including which tools the AI agent is even shown. An
 * unrecognized value must fall to the least privilege, never the most.
 */
describe("toMemberRole", () => {
  it("passes through the known roles", () => {
    expect(toMemberRole("owner")).toBe(MemberRole.Owner);
    expect(toMemberRole("manager")).toBe(MemberRole.Manager);
    expect(toMemberRole("employee")).toBe(MemberRole.Employee);
  });

  it("falls back to the least-privileged role for unknown input", () => {
    for (const value of ["admin", "superuser", "", null, undefined]) {
      expect(toMemberRole(value)).toBe(MemberRole.Employee);
    }
  });

  it("grants no elevated permission to the fallback role", () => {
    const role = toMemberRole("root");
    expect(can(role, Permission.ManageProgram)).toBe(false);
    expect(can(role, Permission.InviteMembers)).toBe(false);
    expect(can(role, Permission.ReverseMovement)).toBe(false);
    expect(can(role, Permission.BlockMembership)).toBe(false);
    // Still able to do its own job.
    expect(can(role, Permission.RegisterVisit)).toBe(true);
  });
});
