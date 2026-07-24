import { describe, expect, it } from "vitest";
import {
  createDemoMembership,
  resolveCardView,
} from "@/lib/loyalty/demo-store";
import { MembershipStatus } from "@/types/domain";

const brand = {
  name: "Auto Lavado El Sol",
  logoUrl: null,
  primaryColor: "#0f766e",
  secondaryColor: "#0ea5e9",
};

describe("demo store", () => {
  it("creates a membership and resolves it as a safe card view", () => {
    const token = createDemoMembership({
      organization: brand,
      customerFullName: "Laura Vega Chaves",
      licensePlate: "ABC123",
      joinedAt: "2026-07-24T10:00:00-06:00",
    });

    const card = resolveCardView(token);
    expect(card).not.toBeNull();
    expect(card?.status).toBe(MembershipStatus.Active);
    // Name is masked (surname reduced to an initial + bullets).
    expect(card?.customerDisplayName).toBe("Laura V•••");
    expect(card?.licensePlate).toBe("ABC123");
    expect(card?.progress.current).toBe(0);
    expect(card?.cardUrl).toContain(`/c/${token}`);
  });

  it("falls back to static samples for known demo tokens", () => {
    expect(resolveCardView("demo")).not.toBeNull();
  });

  it("returns null for unknown tokens", () => {
    expect(resolveCardView("does-not-exist-xyz")).toBeNull();
  });
});
