import type { ParsedBooking } from "./booking";

/**
 * Appends a booking row to the master Google Sheet via a Google Apps Script
 * web app (set SHEETS_WEBHOOK_URL to its /exec URL). This avoids managing a
 * Google service-account key. The Apps Script verifies SHEETS_WEBHOOK_SECRET.
 * Never throws.
 */
export async function appendBookingToSheet(
  b: ParsedBooking
): Promise<{ sent: boolean; skipped?: boolean }> {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) {
    console.warn("[sheet] SHEETS_WEBHOOK_URL not set — skipping sheet append");
    return { sent: false, skipped: true };
  }

  const flat: Record<string, string> = {};
  b.travelers.forEach((t, i) => {
    const n = i + 1;
    flat[`traveler${n}_name`] = t.name;
    flat[`traveler${n}_preferred`] = t.preferredName;
    flat[`traveler${n}_dob`] = t.dob;
    flat[`traveler${n}_gender`] = t.gender;
    flat[`traveler${n}_skill`] = t.skillLevel;
    flat[`traveler${n}_email`] = t.email;
    flat[`traveler${n}_phone`] = t.phone;
  });

  const payload = {
    secret: process.env.SHEETS_WEBHOOK_SECRET ?? "",
    timestamp: new Date().toISOString(),
    occupancy: b.occupancy,
    bedType: b.bedType ?? "",
    amount: b.amountFormatted,
    destination: b.destination ?? "",
    dates: b.dates ?? "",
    travelerCount: String(b.travelers.length),
    customerEmail: b.customerEmail,
    ...flat,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[sheet] append responded", res.status);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[sheet] append failed", err);
    return { sent: false };
  }
}
