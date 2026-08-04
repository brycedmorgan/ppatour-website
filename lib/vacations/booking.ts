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
