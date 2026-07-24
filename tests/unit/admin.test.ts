import { describe, expect, it } from "vitest";
import {
  blockMembership,
  createDemoMembership,
  customersCsv,
  getAuditLog,
  getMembershipDetail,
  listMemberships,
  reactivateMembership,
  registerVisit,
  reissueCard,
  reverseLastVisit,
} from "@/lib/loyalty/demo-store";
import { MembershipStatus } from "@/types/domain";

const brand = {
  name: "Auto Lavado El Sol",
  logoUrl: null,
  primaryColor: "#0f766e",
  secondaryColor: "#0ea5e9",
};
const NOW = "2026-07-24T10:00:00-06:00";

function make(plate: string, phone: string | null = null) {
  return createDemoMembership({
    organization: brand,
    customerFullName: "Test Cliente",
    phoneNormalized: phone,
    licensePlate: plate,
    joinedAt: NOW,
  });
}

describe("admin — listMemberships", () => {
  it("searches by plate and by phone", () => {
    make("SEARCHME1", "+50611112222");
    expect(
      listMemberships({ query: "searchme1" }).some(
        (m) => m.licensePlate === "SEARCHME1",
      ),
    ).toBe(true);
    expect(
      listMemberships({ query: "11112222" }).some(
        (m) => m.phoneNormalized === "+50611112222",
      ),
    ).toBe(true);
  });

  it("filters by status", () => {
    const token = make("BLOCKME1");
    blockMembership(token, NOW);
    const blocked = listMemberships({ status: MembershipStatus.Blocked });
    expect(blocked.some((m) => m.id === token)).toBe(true);
    const active = listMemberships({ status: MembershipStatus.Active });
    expect(active.some((m) => m.id === token)).toBe(false);
  });
});

describe("admin — block / reactivate (audited)", () => {
  it("toggles status and records audit entries", () => {
    const token = make("TOGGLE1");
    blockMembership(token, NOW);
    expect(getMembershipDetail(token)?.status).toBe(MembershipStatus.Blocked);
    reactivateMembership(token, NOW);
    expect(getMembershipDetail(token)?.status).toBe(MembershipStatus.Active);
    const actions = getAuditLog()
      .filter((a) => a.entityId === token)
      .map((a) => a.action);
    expect(actions).toContain("membership.block");
    expect(actions).toContain("membership.reactivate");
  });
});

describe("admin — reissueCard revokes the old token", () => {
  it("moves the membership and its ledger to a new token", () => {
    const token = make("REISSUE1");
    registerVisit(token, `v-${token}`, NOW);
    const result = reissueCard(token, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(getMembershipDetail(token)).toBeNull();
      const moved = getMembershipDetail(result.newToken);
      expect(moved?.licensePlate).toBe("REISSUE1");
      expect(moved?.events.length).toBeGreaterThan(0);
    }
  });
});

describe("admin — reverseLastVisit (§Flujo G)", () => {
  it("requires a reason", () => {
    const token = make("REV1");
    registerVisit(token, `rv-${token}`, NOW);
    const r = reverseLastVisit(token, "  ", NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("reason_required");
  });

  it("appends a reversal event and decrements the cycle", () => {
    const token = make("REV2");
    registerVisit(token, `rv2a-${token}`, NOW);
    registerVisit(token, `rv2b-${token}`, NOW);
    const before = getMembershipDetail(token)!.progress.current;
    const r = reverseLastVisit(token, "registrado por error", NOW);
    expect(r.ok).toBe(true);
    const after = getMembershipDetail(token)!;
    expect(after.progress.current).toBe(before - 1);
    // Ledger keeps history: reversal is an appended event, not a deletion.
    expect(after.events.some((e) => e.type === "visit_reversed")).toBe(true);
  });
});

describe("admin — CSV export", () => {
  it("produces a header row with expected columns", () => {
    make("CSV1");
    const csv = customersCsv();
    expect(csv.split("\n")[0]).toContain("cliente");
    expect(csv.split("\n")[0]).toContain("placa");
    expect(csv).toContain("CSV1");
  });
});
