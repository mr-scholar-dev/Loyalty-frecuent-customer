import { describe, expect, it } from "vitest";
import {
  createDemoMembership,
  parseScannedToken,
  registerVisit,
  redeemReward,
  resolveCardView,
  getStaffView,
} from "@/lib/loyalty/demo-store";
import { MembershipStatus } from "@/types/domain";

const brand = {
  name: "Auto Lavado El Sol",
  logoUrl: null,
  primaryColor: "#0f766e",
  secondaryColor: "#0ea5e9",
};

const NOW = "2026-07-24T10:00:00-06:00";

function freshToken() {
  return createDemoMembership({
    organization: brand,
    customerFullName: "Laura Vega Chaves",
    licensePlate: "ABC123",
    joinedAt: NOW,
  });
}

describe("demo store — card & staff views", () => {
  it("creates a membership and resolves it as a safe (masked) card view", () => {
    const token = freshToken();
    const card = resolveCardView(token);
    expect(card?.status).toBe(MembershipStatus.Active);
    expect(card?.customerDisplayName).toBe("Laura V•••");
    expect(card?.cardUrl).toContain(`/c/${token}`);
  });

  it("exposes the unmasked name to staff", () => {
    const token = freshToken();
    expect(getStaffView(token)?.customerFullName).toBe("Laura Vega Chaves");
  });

  it("resolves seeded demo tokens and rejects unknown ones", () => {
    expect(resolveCardView("demo")).not.toBeNull();
    expect(resolveCardView("nope-xyz")).toBeNull();
  });
});

describe("parseScannedToken", () => {
  it("extracts a token from a card URL", () => {
    expect(parseScannedToken("https://x.com/c/abc123?y=1")).toBe("abc123");
  });
  it("returns a raw token unchanged", () => {
    expect(parseScannedToken("  abc123 ")).toBe("abc123");
  });
});

describe("registerVisit / redeemReward (§11, §12)", () => {
  it("earns a reward on the 9th paid visit and resets the cycle", () => {
    const token = freshToken();
    let rewardEarned = false;
    for (let i = 0; i < 9; i++) {
      const r = registerVisit(token, `k-${token}-${i}`, NOW);
      expect(r.ok).toBe(true);
      if (r.ok) rewardEarned = !!r.rewardEarned;
    }
    expect(rewardEarned).toBe(true);
    const view = getStaffView(token);
    expect(view?.progress.current).toBe(0);
    expect(view?.progress.availableRewards).toBe(1);
  });

  it("is idempotent: a repeated key does not double-count", () => {
    const token = freshToken();
    const first = registerVisit(token, "same-key", NOW);
    const second = registerVisit(token, "same-key", NOW);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("duplicate");
    expect(getStaffView(token)?.progress.current).toBe(1);
  });

  it("refuses to register a visit on a blocked card", () => {
    const r = registerVisit("demo-blocked", "kb-1", NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("blocked");
  });

  it("redeems an available reward and rejects when none remain", () => {
    const token = freshToken();
    for (let i = 0; i < 9; i++) registerVisit(token, `rk-${token}-${i}`, NOW);
    const ok = redeemReward(token, `redeem-${token}`, NOW);
    expect(ok.ok).toBe(true);
    const again = redeemReward(token, `redeem2-${token}`, NOW);
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.reason).toBe("no_reward");
  });
});
