import { NextRequest, NextResponse } from "next/server";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import {
  addSubscriber,
  updateSubscriberStatus,
  updateSubscriberByCustomerId,
} from "@/lib/subscribers";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("Webhook: Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      getStripeWebhookSecret()
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log(`Webhook received: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email || session.customer_details?.email;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (email && customerId && subscriptionId) {
          await addSubscriber(email, customerId, subscriptionId);
          console.log(`Subscriber added: ${email}`);
        } else {
          console.error("Webhook: Missing data in checkout.session.completed", {
            email,
            customerId,
            subscriptionId,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;

        let subscriberStatus: "active" | "cancelled" | "past_due" | "paused";
        switch (status) {
          case "active":
          case "trialing":
            subscriberStatus = "active";
            break;
          case "past_due":
            subscriberStatus = "past_due";
            break;
          case "canceled":
          case "unpaid":
            subscriberStatus = "cancelled";
            break;
          case "paused":
            subscriberStatus = "paused";
            break;
          default:
            subscriberStatus = "cancelled";
        }

        await updateSubscriberStatus(subscription.id, subscriberStatus);
        console.log(
          `Subscription ${subscription.id} updated to ${subscriberStatus}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscriberStatus(subscription.id, "cancelled");
        console.log(`Subscription ${subscription.id} cancelled`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await updateSubscriberByCustomerId(customerId, "past_due");
        console.log(`Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
