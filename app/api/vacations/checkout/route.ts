import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/vacations/stripe";
import { PRICING } from "@/lib/vacations/pricing";
import {
  validateRegistration,
  type RegistrationPayload,
} from "@/lib/vacations/registration";
import { trip } from "@/lib/vacations/content";
import { getAvailability } from "@/lib/vacations/capacity";

// Stripe's Node SDK — not the edge runtime.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let payload: RegistrationPayload;
  try {
    payload = (await req.json()) as RegistrationPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const errors = validateRegistration(payload);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const option = PRICING[payload.occupancy];
  const origin = req.headers.get("origin") ?? req.nextUrl.origin;

  // Hard stop at the contracted room block. The pricing cards already hide a
  // sold-out option, but the client is not the gate — someone deep-linking
  // /vacations/register?occupancy=single would otherwise book room 11 and put
  // Lainey over what the resort agreed to hold.
  const availability = await getAvailability();
  if (availability.known && availability.options[payload.occupancy].soldOut) {
    return NextResponse.json(
      {
        error: `${option.label} is fully booked for ${trip.destination}. Email ${trip.contactEmail} and we'll add you to the waiting list.`,
        soldOut: true,
      },
      { status: 409 }
    );
  }

  // Flatten traveler details into Stripe metadata for the organizer.
  const metadata: Record<string, string> = {
    occupancy: option.label,
    nights: String(trip.nights),
    destination: trip.destination,
    dates: trip.datesLabel,
  };
  if (payload.bedType) metadata.bed_type = payload.bedType;
  payload.travelers.forEach((t, i) => {
    const n = i + 1;
    metadata[`traveler${n}_name`] = `${t.firstName} ${t.lastName}`.trim();
    if (t.preferredName?.trim())
      metadata[`traveler${n}_preferred`] = t.preferredName.trim();
    metadata[`traveler${n}_dob`] = t.dob;
    metadata[`traveler${n}_gender`] = t.gender;
    metadata[`traveler${n}_email`] = t.email;
    metadata[`traveler${n}_phone`] = t.phone;
    metadata[`traveler${n}_skill`] = t.skillLevel;
  });

  try {
    const stripe = getStripe();
    const lead = payload.travelers[0];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: lead.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: option.amountCents,
            product_data: {
              name: `Pickleball Vacations — ${trip.destination}`,
              description: `${option.label} · ${trip.datesLabel} · ${trip.nights} nights`,
            },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      // Trailing slashes are deliberate: next.config sets `trailingSlash: true`,
      // so the bare path would cost every paying guest a 308 on the way back
      // from Stripe.
      success_url: `${origin}/vacations/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/vacations/register/?occupancy=${payload.occupancy}&canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    const notConfigured = detail.includes("STRIPE_SECRET_KEY");
    return NextResponse.json(
      {
        error: notConfigured
          ? "Payments aren't configured yet."
          : "We couldn't start checkout. Please try again or contact us.",
        detail,
      },
      { status: notConfigured ? 503 : 500 }
    );
  }
}
