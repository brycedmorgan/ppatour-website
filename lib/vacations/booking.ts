import type Stripe from "stripe";

export type ParsedTraveler = {
  name: string;
  preferredName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  skillLevel: string;
};

export type ParsedBooking = {
  occupancy: string;
  bedType?: string;
  nights?: string;
  destination?: string;
  dates?: string;
  amountFormatted: string;
  customerEmail: string;
  travelers: ParsedTraveler[];
};

/**
 * Is this Checkout Session actually a Vacations booking?
 *
 * ⚠ The webhook destination is registered against the whole Stripe account, so
 * it receives EVERY `checkout.session.completed` — the WooCommerce store on
 * vibepb.com, MemberPress, event ticketing, all of it. Without this check
 * `parseBookingFromSession` happily turns a $25 ticket into a booking with a
 * blank room and no travelers, and the guest gets a Pickleball Vacations
 * confirmation for a trip they did not buy. That is not hypothetical: Lainey
 * was forwarded exactly such an email in June 2026 for a Boise Challenger
 * payment.
 *
 * We key off metadata written by `/api/vacations/checkout`, which is the only
 * thing that creates these sessions. `source` is the explicit marker; the
 * destination + occupancy + traveler check is the fallback that recognises
 * sessions created BEFORE `source` was added, which matters because failed
 * deliveries from the 8/5–8/20 outage are still queued for retry.
 */
export function isVacationsBooking(session: Stripe.Checkout.Session): boolean {
  const m = session.metadata ?? {};
  if (m.source === "vacations") return true;
  return Boolean(m.destination && m.occupancy && m.traveler1_name);
}

/**
 * Reconstruct a structured booking from the metadata we stored on the Stripe
 * Checkout Session (see src/app/api/checkout/route.ts).
 */
export function parseBookingFromSession(
  session: Stripe.Checkout.Session
): ParsedBooking {
  const m = session.metadata ?? {};

  const travelers: ParsedTraveler[] = [];
  for (let n = 1; m[`traveler${n}_name`]; n++) {
    travelers.push({
      name: m[`traveler${n}_name`] ?? "",
      preferredName: m[`traveler${n}_preferred`] ?? "",
      dob: m[`traveler${n}_dob`] ?? "",
      gender: m[`traveler${n}_gender`] ?? "",
      email: m[`traveler${n}_email`] ?? "",
      phone: m[`traveler${n}_phone`] ?? "",
      skillLevel: m[`traveler${n}_skill`] ?? "",
    });
  }

  const amount = (session.amount_total ?? 0) / 100;
  const amountFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (session.currency ?? "usd").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);

  return {
    occupancy: m.occupancy ?? "",
    bedType: m.bed_type,
    nights: m.nights,
    destination: m.destination,
    dates: m.dates,
    amountFormatted,
    customerEmail:
      session.customer_details?.email ??
      session.customer_email ??
      travelers[0]?.email ??
      "",
    travelers,
  };
}
