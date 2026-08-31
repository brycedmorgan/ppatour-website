import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/vacations/stripe";
import { isVacationsBooking, parseBookingFromSession } from "@/lib/vacations/booking";
import { sendBookingEmails } from "@/lib/vacations/email";
import { postBookingToJackalope } from "@/lib/vacations/jackalope";
import { invalidateAvailability } from "@/lib/vacations/capacity";

/**
 * ⚠ REGISTER THIS ENDPOINT IN STRIPE **WITH THE TRAILING SLASH**:
 * `https://www.ppatour.com/api/vacations/stripe-webhook/`
 *
 * `trailingSlash: true` in next.config.ts answers the unslashed path with a
 * 308, and Stripe does not follow redirects. Registered unslashed on 8/5, this
 * endpoint failed 100% of deliveries until 8/20 and route.ts never once ran —
 * no email, no sheet row, no cache invalidation, while every payment succeeded
 * normally. Silent, and the worst failure mode here. See docs/VACATIONS.md.
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

    // This destination receives every checkout on the account, not just ours.
    // Anything that isn't a Vacations booking is acknowledged and dropped —
    // 200 so Stripe stops retrying, but no email and no sheet row.
    if (!isVacationsBooking(session)) {
      console.log(
        `[vacations webhook] ignoring non-vacations session ${session.id}`
      );
      return NextResponse.json({ received: true, ignored: true });
    }

    const booking = parseBookingFromSession(session);

    // A room just went. Drop the cached count so the next page render and the
    // next checkout attempt both see it, rather than waiting out the TTL.
    invalidateAvailability();

    // Fire side-effects. We deliberately swallow per-channel errors and still
    // return 200 so Stripe doesn't retry and cause duplicate emails/rows.
    const [emails, filed] = await Promise.allSettled([
      sendBookingEmails(booking),
      postBookingToJackalope(booking),
    ]);
    if (emails.status === "rejected")
      console.error("[vacations webhook] emails", emails.reason);
    if (filed.status === "rejected")
      console.error("[vacations webhook] jackalope", filed.reason);
  }

  return NextResponse.json({ received: true });
}
