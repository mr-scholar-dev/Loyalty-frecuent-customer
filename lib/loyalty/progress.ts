/**
 * Loyalty program math (§11) — pure, database-free.
 *
 * These functions are the single source of truth for how paid visits turn into
 * rewards. The transactional PostgreSQL RPCs (deferred) must implement the same
 * rules; keeping them here lets us unit-test the promo logic in isolation and
 * later assert parity with the database.
 *
 * Rule (defaults): 9 paid visits -> 1 free wash.
 *   - The free wash does NOT count toward progress.
 *   - Earning a reward resets the cycle to 0 but rewards accumulate (rolling).
 */

export interface ProgramConfig {
  /** Paid visits required to earn a reward (default 9). */
  paidVisitsRequired: number;
  /** Rewards granted when the cycle completes (default 1). */
  rewardQuantity: number;
}

export interface BalanceState {
  paidVisitsInCycle: number;
  availableRewards: number;
}

export interface ProgressView {
  current: number;
  required: number;
  remaining: number;
  availableRewards: number;
  /** e.g. "3 de 9 lavados" */
  progressLabel: string;
  /** e.g. "Faltan 6 lavados" (or a ready-to-redeem message) */
  remainingLabel: string;
}

export const DEFAULT_PROGRAM: ProgramConfig = {
  paidVisitsRequired: 9,
  rewardQuantity: 1,
};

function assertValidProgram(program: ProgramConfig): void {
  if (
    !Number.isInteger(program.paidVisitsRequired) ||
    program.paidVisitsRequired < 1
  ) {
    throw new RangeError("paidVisitsRequired must be a positive integer");
  }
  if (!Number.isInteger(program.rewardQuantity) || program.rewardQuantity < 1) {
    throw new RangeError("rewardQuantity must be a positive integer");
  }
}

/** Spanish pluralization for "lavado" / "lavados". */
function washWord(n: number): string {
  return n === 1 ? "lavado" : "lavados";
}

/** Build a display-friendly progress view from a balance + program. */
export function getProgressView(
  balance: BalanceState,
  program: ProgramConfig = DEFAULT_PROGRAM,
): ProgressView {
  assertValidProgram(program);
  const required = program.paidVisitsRequired;
  const current = Math.max(0, Math.min(balance.paidVisitsInCycle, required));
  const remaining = Math.max(0, required - current);

  const remainingLabel =
    balance.availableRewards > 0 && remaining === required
      ? "Tienes un lavado gratis disponible"
      : remaining === 0
        ? "¡Lavado gratis desbloqueado!"
        : `Faltan ${remaining} ${washWord(remaining)}`;

  return {
    current,
    required,
    remaining,
    availableRewards: balance.availableRewards,
    progressLabel: `${current} de ${required} ${washWord(required)}`,
    remainingLabel,
  };
}

export interface ApplyResult {
  balance: BalanceState;
  /** True when this paid visit completed a cycle and granted a reward. */
  rewardEarned: boolean;
}

/**
 * Apply one PAID visit to a balance (mirrors `register_paid_visit`).
 * When the cycle target is reached: grant reward(s) and reset the cycle to 0.
 */
export function applyPaidVisit(
  balance: BalanceState,
  program: ProgramConfig = DEFAULT_PROGRAM,
): ApplyResult {
  assertValidProgram(program);
  const nextCycle = balance.paidVisitsInCycle + 1;

  if (nextCycle >= program.paidVisitsRequired) {
    return {
      balance: {
        paidVisitsInCycle: 0,
        availableRewards: balance.availableRewards + program.rewardQuantity,
      },
      rewardEarned: true,
    };
  }

  return {
    balance: {
      paidVisitsInCycle: nextCycle,
      availableRewards: balance.availableRewards,
    },
    rewardEarned: false,
  };
}

/**
 * Redeem one available reward (mirrors `redeem_reward`).
 * Does not affect cycle progress. Throws if no reward is available.
 */
export function applyRedeemReward(balance: BalanceState): BalanceState {
  if (balance.availableRewards < 1) {
    throw new RangeError("No available rewards to redeem");
  }
  return {
    paidVisitsInCycle: balance.paidVisitsInCycle,
    availableRewards: balance.availableRewards - 1,
  };
}
