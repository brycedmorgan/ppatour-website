import type { ParsedBooking } from "./booking";

/**
 * Files a paid booking into Jackalope (`/api/public/vac-booking`), which is
 * where Lainey reads it.
 *
 * This replaces the Google Sheet. `sheet.ts` posted a flat row to a Google
 * Apps Script web app; it was never wired up after Vacations moved onto
 * ppatour.com, and that sheet still holds nothing but two smoke-test rows from
 * 2026-05-30. Jackalope already has the other three quarters of this picture —
 * `vac_events` (visits), `vac_trips` (the contracted block) and
 * `stripe_charges` (the money) — so the travelers belong in the same database
 * rather than a fourth place. `stripe_charges` has the payment but NOT the
 * passport names, dates of birth, gender and skill levels, and that manifest is
 * the thing the resort actually needs.
 *
 * Idempotent on the Stripe session id, on the Jackalope side. That matters
 * because Stripe redelivers — failed events retry automatically for days, and
 * the 8/5–8/20 outage backlog is being replayed by hand.
 *
 * Never throws. A booking that reaches Stripe is real money and must not be
 * undone by a reporting write failing; the webhook returns 200 either way.
 */
export async function postBookingToJackalope(
  b: ParsedBooking
): Promise<{ sent: boolean; skipped?: boolean }> {
  const url =
    process.env.JACKALOPE_BOOKING_URL ??
    "https://pickleball.usejackalope.com/api/public/vac-booking";
  const secret = process.env.VAC_BOOKING_SECRET;

  if (!secret) {
    console.warn(
      "[jackalope] VAC_BOOKING_SECRET not set — skipping booking write"
    );
    return { sent: false, skipped: true };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vac-secret": secret,
      },
      body: JSON.stringify({
        stripeSessionId: b.stripeSessionId,
        destination: b.destination ?? "",
        dates: b.dates ?? "",
        occupancy: b.occupancy,
        bedType: b.bedType ?? "",
        nights: b.nights ?? "",
        amount: b.amountFormatted,
        customerEmail: b.customerEmail,
        travelers: b.travelers,
      }),
    });
    if (!res.ok) {
      console.error("[jackalope] booking write responded", res.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[jackalope] booking write failed", err);
    return { sent: false };
  }
}
