import "server-only";
import Stripe from "stripe";

/**
 * Stripe client — SERVER ONLY. Returns null until STRIPE_SECRET_KEY is set, so
 * the billing UI degrades gracefully while Stripe isn't configured yet.
 *
 * To go live: set STRIPE_SECRET_KEY + STRIPE_PRICE_ID (the Pro monthly price)
 * and STRIPE_WEBHOOK_SECRET, then implement the webhook to persist each org's
 * subscription status (needs a public URL → after deploy).
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export type PlanInterval = "monthly" | "annual";

/** Stripe price id for the chosen billing interval. Falls back to monthly. */
export function getProPriceId(plan: PlanInterval = "monthly"): string | null {
  if (plan === "annual") {
    return process.env.STRIPE_PRICE_ID_ANNUAL ?? null;
  }
  return process.env.STRIPE_PRICE_ID ?? null;
}
