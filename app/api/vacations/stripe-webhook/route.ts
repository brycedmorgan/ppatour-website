import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/vacations/stripe";
import { parseBookingFromSession } from "@/lib/vacations/booking";
import { sendBookingEmails } from "@/lib/vacations/email";
import { appendBookingToSheet } from "@/lib/vacations/sheet";
import { invalidateAvailability } from "@/lib/vacations/capacity";

/**
 * ⚠ This endpoint moved when Vacations came onto ppatour.com. The Stripe
 * webhook must be re-pointed at
 * `https://www.ppatour.com/api/vacations/stripe-webhook` or paid bookings stop
 * producing a confirmation email and a sheet row — the payment still succeeds,
 * so the failure is silent. See docs/VACATIONS.md.
 */

// Stripe needs the raw request body + Node runtime for signature verification.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      {
        error:
          "Webhook not configured (missing signature or STRIPE_WEBHOOK_SECRET).",
      },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${msg}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const booking = parseBookingFromSession(session);

    // A room just went. Drop the cached count so the next page render and the
    // next checkout attempt both see it, rather than waiting out the TTL.
    invalidateAvailability();

    // Fire side-effects. We deliberately swallow per-channel errors and still
    // return 200 so Stripe doesn't retry and cause duplicate emails/rows.
    const [emails, sheet] = await Promise.allSettled([
      sendBookingEmails(booking),
      appendBookingToSheet(booking),
    ]);
    if (emails.status === "rejected")
      console.error("[vacations webhook] emails", emails.reason);
    if (sheet.status === "rejected")
      console.error("[vacations webhook] sheet", sheet.reason);
  }

  return NextResponse.json({ received: true });
}
