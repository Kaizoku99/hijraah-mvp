import Stripe from "stripe";
import { env } from "./_core/env";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { SUBSCRIPTION_TIERS, getTierById } from "./stripe-products";

// Initialize Stripe lazily to avoid errors when key is not set
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured. Please set it in your .env file.");
    }
    _stripe = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// For backward compatibility - use getStripe() in functions that need it
const stripe = { get instance() { return getStripe(); } };

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(options: {
  userId: number;
  userEmail: string;
  tierId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const tier = getTierById(options.tierId);
  if (!tier || !tier.stripePriceId) {
    throw new Error(`Invalid tier: ${options.tierId}`);
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get or create Stripe customer
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, options.userId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult[0];
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    // Create new Stripe customer
    const customer = await stripe.instance.customers.create({
      email: options.userEmail,
      metadata: {
        userId: options.userId.toString(),
      },
    });
    customerId = customer.id;

    // Save customer ID to database
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, options.userId));
  }

  // Create checkout session
  const session = await stripe.instance.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: tier.stripePriceId,
        quantity: 1,
      },
    ],
    mode: tier.interval === "one_time" ? "payment" : "subscription",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: {
      userId: options.userId.toString(),
      tierId: options.tierId,
    },
    subscription_data: tier.interval !== "one_time" ? {
      metadata: {
        userId: options.userId.toString(),
        tierId: options.tierId,
      },
    } : undefined,
  });

  return { sessionId: session.id, url: session.url };
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createPortalSession(options: {
  userId: number;
  returnUrl: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, options.userId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult[0];
  if (!user.stripeCustomerId) {
    throw new Error("No Stripe customer found for this user");
  }

  const session = await stripe.instance.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: options.returnUrl,
  });

  return { url: session.url };
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(payload: string, signature: string) {
  let event: Stripe.Event;

  try {
    event = stripe.instance.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.userId || "0");
      const tierId = session.metadata?.tierId || "free";

      if (userId > 0) {
        // Update user subscription
        await db
          .update(users)
          .set({
            subscriptionTier: tierId as any,
            subscriptionStatus: "active",
            stripeSubscriptionId: session.subscription as string || null,
            subscriptionExpiresAt: tierId === "vip"
              ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months for VIP
              : null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        console.log(`User ${userId} upgraded to ${tierId}`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        const tierId = subscription.metadata?.tierId || "essential";

        await db
          .update(users)
          .set({
            subscriptionStatus: subscription.status === "active" ? "active" :
              subscription.status === "canceled" ? "canceled" : "expired",
            subscriptionExpiresAt: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000)
              : null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];

        // Downgrade to free tier
        await db
          .update(users)
          .set({
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        console.log(`User ${user.id} downgraded to free tier`);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Find user by Stripe customer ID
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];

        await db
          .update(users)
          .set({
            subscriptionStatus: "expired",
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        console.log(`Payment failed for user ${user.id}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { received: true };
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    return null;
  }

  const user = userResult[0];
  const tier = getTierById(user.subscriptionTier || "free");

  return {
    tier: user.subscriptionTier || "free",
    status: user.subscriptionStatus || "active",
    expiresAt: user.subscriptionExpiresAt,
    limits: tier?.limits || SUBSCRIPTION_TIERS.free.limits,
    features: tier?.features || SUBSCRIPTION_TIERS.free.features,
  };
}

/**
 * Get payment history for a user
 */
export async function getPaymentHistory(userId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    return [];
  }

  const user = userResult[0];
  if (!user.stripeCustomerId) {
    return [];
  }

  // Fetch invoices from Stripe
  const invoices = await stripe.instance.invoices.list({
    customer: user.stripeCustomerId,
    limit: 10,
    status: 'paid',
  });

  return invoices.data.map((invoice) => ({
    id: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status,
    date: new Date(invoice.created * 1000),
    pdfUrl: invoice.invoice_pdf,
    number: invoice.number,
  }));
}
