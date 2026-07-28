import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook — persists each organization's subscription status.
 *
 * Inert until STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET are set (needs a public
 * URL → configure after deploy). Requires the billing migration
 * (20260727180000_billing.sql) applied so the stripe_* columns exist.
 *
 * Billing anchors to the day the org subscribes (Stripe's own period), so
 * "cobramos por mes a la fecha que se registren" holds automatically:
 * current_period_end carries the paid-through date.
 */
export const dynamic = "force-dynamic";

async function activateOrg(
  organizationId: string,
  fields: {
    status: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: number | null;
  },
): Promise<void> {
  const admin = createAdminClient();
  const update: Record<string, unknown> = { status: fields.status };
  if (fields.stripeCustomerId) update.stripe_customer_id = fields.stripeCustomerId;
  if (fields.stripeSubscriptionId)
    update.stripe_subscription_id = fields.stripeSubscriptionId;
  if (fields.currentPeriodEnd)
    update.current_period_end = new Date(
      fields.currentPeriodEnd * 1000,
    ).toISOString();
  if (fields.status === "active") update.activated_at = new Date().toISOString();

  const { error } = await admin
    .from("organizations")
    .update(update)
    .eq("id", organizationId);

  // Resilient to the billing migration not being applied yet: the stripe_*
  // columns may not exist locally. Fall back to flipping just the status so the
  // org still unlocks; the extra fields persist once the migration is applied.
  if (error) {
    await admin
      .from("organizations")
      .update({ status: fields.status })
      .eq("id", organizationId);
  }
}

async function orgIdForCustomer(customerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe no configurado." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta firma." }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId =
        session.client_reference_id ??
        (session.metadata?.organization_id as string | undefined) ??
        null;
      if (organizationId) {
        await activateOrg(organizationId, {
          status: "active",
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const organizationId = await orgIdForCustomer(customerId);
      if (organizationId) {
        // active/trialing → usable; anything else (past_due, canceled…) suspends.
        const usable = sub.status === "active" || sub.status === "trialing";
        await activateOrg(organizationId, {
          status: usable ? "active" : "suspended",
          stripeSubscriptionId: sub.id,
          currentPeriodEnd:
            (sub as unknown as { current_period_end?: number })
              .current_period_end ?? null,
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
