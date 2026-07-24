import { describe, expect, it } from "vitest";
import {
  createDemoMembership,
  getDashboardMetrics,
  registerVisit,
} from "@/lib/loyalty/demo-store";

const brand = {
  name: "Auto Lavado El Sol",
  logoUrl: null,
  primaryColor: "#0f766e",
  secondaryColor: "#0ea5e9",
};

describe("getDashboardMetrics (§15)", () => {
  it("counts a freshly registered visit as a wash today", () => {
    const now = new Date().toISOString();
    const before = getDashboardMetrics(now);

    const token = createDemoMembership({
      organization: brand,
      customerFullName: "Diego Ramírez",
      licensePlate: "XYZ999",
      joinedAt: now,
    });
    registerVisit(token, `dash-${token}`, now);

    const after = getDashboardMetrics(now);
    expect(after.totalCustomers).toBe(before.totalCustomers + 1);
    expect(after.washesToday).toBe(before.washesToday + 1);
    expect(after.recentActivity[0]?.licensePlate).toBe("XYZ999");
  });

  it("flags a membership one visit away from the reward", () => {
    const now = new Date().toISOString();
    const token = createDemoMembership({
      organization: brand,
      customerFullName: "Sofía Núñez",
      licensePlate: "AAA111",
      joinedAt: now,
    });
    // 8 visits => 8/9, one away.
    for (let i = 0; i < 8; i++) registerVisit(token, `near-${token}-${i}`, now);

    const metrics = getDashboardMetrics(now);
    const found = metrics.nearReward.find((n) => n.licensePlate === "AAA111");
    expect(found?.current).toBe(8);
    expect(found?.required).toBe(9);
  });
});
