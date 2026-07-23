import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROGRAM,
  applyPaidVisit,
  applyRedeemReward,
  getProgressView,
  type BalanceState,
} from "@/lib/loyalty/progress";

const fresh: BalanceState = { paidVisitsInCycle: 0, availableRewards: 0 };

describe("applyPaidVisit (9 -> reward)", () => {
  it("increments progress within a cycle", () => {
    const r = applyPaidVisit({ paidVisitsInCycle: 0, availableRewards: 0 });
    expect(r.balance.paidVisitsInCycle).toBe(1);
    expect(r.rewardEarned).toBe(false);
  });

  it("grants a reward and resets the cycle on the 9th paid visit", () => {
    let balance: BalanceState = fresh;
    let lastRewardEarned = false;
    for (let i = 0; i < 9; i++) {
      const r = applyPaidVisit(balance);
      balance = r.balance;
      lastRewardEarned = r.rewardEarned;
    }
    expect(lastRewardEarned).toBe(true);
    expect(balance.paidVisitsInCycle).toBe(0);
    expect(balance.availableRewards).toBe(1);
  });

  it("keeps prior rewards while starting a new cycle (rolling)", () => {
    // Already earned 1 reward, now 3 into the next cycle.
    let balance: BalanceState = { paidVisitsInCycle: 2, availableRewards: 1 };
    balance = applyPaidVisit(balance).balance;
    expect(balance.paidVisitsInCycle).toBe(3);
    expect(balance.availableRewards).toBe(1);
  });
});

describe("applyRedeemReward", () => {
  it("decrements available rewards without touching progress", () => {
    const next = applyRedeemReward({
      paidVisitsInCycle: 4,
      availableRewards: 2,
    });
    expect(next.availableRewards).toBe(1);
    expect(next.paidVisitsInCycle).toBe(4);
  });

  it("throws when no rewards are available", () => {
    expect(() => applyRedeemReward(fresh)).toThrow(RangeError);
  });
});

describe("getProgressView labels", () => {
  it("formats progress and remaining", () => {
    const v = getProgressView({ paidVisitsInCycle: 3, availableRewards: 0 });
    expect(v.progressLabel).toBe("3 de 9 lavados");
    expect(v.remainingLabel).toBe("Faltan 6 lavados");
    expect(v.remaining).toBe(6);
  });

  it("uses singular for a single remaining wash", () => {
    const v = getProgressView({ paidVisitsInCycle: 8, availableRewards: 0 });
    expect(v.remainingLabel).toBe("Faltan 1 lavado");
  });

  it("announces an available reward at cycle start", () => {
    const v = getProgressView({ paidVisitsInCycle: 0, availableRewards: 1 });
    expect(v.remainingLabel).toBe("Tienes un lavado gratis disponible");
  });

  it("respects a custom program config", () => {
    const v = getProgressView(
      { paidVisitsInCycle: 1, availableRewards: 0 },
      { paidVisitsRequired: 5, rewardQuantity: 1 },
    );
    expect(v.progressLabel).toBe("1 de 5 lavados");
  });

  it("exposes sane defaults", () => {
    expect(DEFAULT_PROGRAM.paidVisitsRequired).toBe(9);
  });
});
