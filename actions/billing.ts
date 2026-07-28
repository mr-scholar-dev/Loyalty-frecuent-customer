"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { getActiveMembership } from "@/lib/supabase/auth";
import { getProPriceId, getStripe, type PlanInterval } from "@/lib/stripe";

/**
 * Start a Stripe Checkout for the Pro subscription (per organization).
 *
 * Scaffolded: returns a friendly message until Stripe is configured
 * (STRIPE_SECRET_KEY + STRIPE_PRICE_ID). When configured, redirects to Stripe
 * Checkout. Subscription status is persisted by the webhook (pending, needs a
 * public URL after deploy).
 */
export interface CheckoutResult {
  ok: false;
  message: string;
}

export async function createCheckout(
  plan: PlanInterval = "monthly",
): Promise<CheckoutResult> {
  const membership = await getActiveMembership();
  if (!membership || membership.role !== "owner") {
    return {
      ok: false,
      message: "Solo el propietario puede gestionar el pago.",
    };
  }

  const stripe = getStripe();
  const priceId = getProPriceId(plan);
  if (!stripe || !priceId) {
    return {
      ok: false,
      message:
        "El pago en línea aún no está activo. Escríbenos por WhatsApp para activar tu plan.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3200";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?ok=1`,
    cancel_url: `${appUrl}/dashboard/billing`,
    client_reference_id: membership.organizationId,
    metadata: { organization_id: membership.organizationId, plan },
  });

  if (!session.url) {
    return { ok: false, message: "No se pudo iniciar el pago." };
  }
  // External Stripe URL — typedRoutes types redirect() for internal routes.
  redirect(session.url as Route);
}
