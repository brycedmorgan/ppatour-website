import sgMail from "@sendgrid/mail";
import { trip } from "./content";
import type { ParsedBooking } from "./booking";
import { flightSearchUrl } from "@/lib/affiliate";

const REPLY_TO = trip.contactEmail; // vacations@pickleball.com
const BRAND = "Pickleball Vacations";

/**
 * Destination → nearest airport for the "book your flights" upsell. Airfare is
 * the guest's own arrangement (the package covers ground transfers only — see
 * content.ts), so a marker-tagged flight search earns us affiliate commission
 * on a booking the guest has to make anyway.
 */
const DEST_AIRPORT: Record<string, { code: string; label: string }> = {
  "Club Med Turkoise": { code: "PLS", label: "Providenciales (PLS)" },
  "Club Med Punta Cana": { code: "PUJ", label: "Punta Cana (PUJ)" },
};

function airportFor(dest?: string): { code: string; label: string } | null {
  if (!dest) return null;
  for (const [name, ap] of Object.entries(DEST_AIRPORT)) {
    if (dest.includes(name) || dest.includes(ap.code)) return ap;
  }
  return null;
}

/** Marker-tagged flight-search CTA for the confirmation email; "" if no airport. */
function flightBlock(b: ParsedBooking): string {
  const ap = airportFor(b.destination);
  if (!ap) return "";
  const url = flightSearchUrl({
    destIata: ap.code,
    departDate: "",
    returnDate: "",
    passengers: b.travelers.length,
  });
  return `
      <div style="margin:20px 0;padding:18px;background:#eefbfd;border:1px solid #b7e7ee;">
        <p style="margin:0 0 10px;font-size:15px;line-height:1.5;"><strong>Now book your flights.</strong> Airfare into ${ap.label} is on you, so lock in a good fare early — then send your details to your trip coordinator for your airport transfers.</p>
        <a href="${url}" style="display:inline-block;background:#0c8ea0;color:#fff;text-decoration:none;font-size:13px;font-weight:bold;padding:11px 20px;">Search flights to ${ap.label} &#8594;</a>
      </div>`;
}

type EmailResult = { customer: boolean; internal: boolean; skipped?: boolean };

function configure(): { from: { email: string; name: string } } | null {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM; // a SendGrid-verified sender email
  if (!key || !from) return null;
  sgMail.setApiKey(key);
  return { from: { email: from, name: BRAND } };
}

function travelersTable(b: ParsedBooking): string {
  return b.travelers
    .map(
      (t, i) => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${i + 1}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${t.name}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${t.preferredName}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${t.dob}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${t.gender}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${t.skillLevel}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${t.email}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${t.phone}</td>
      </tr>`
    )
    .join("");
}

function customerHtml(b: ParsedBooking): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#12294c;">
    <div style="background:#12294c;padding:28px 24px;text-align:center;">
      <p style="margin:0;color:#93e1ea;letter-spacing:3px;font-size:12px;font-weight:bold;">${BRAND.toUpperCase()}</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;">You're confirmed!</h1>
    </div>
    <div style="padding:28px 24px;background:#f8fcfd;">
      <p style="font-size:16px;line-height:1.6;">Thank you for booking your spot on <strong>${BRAND}</strong>${
        b.destination ? ` at <strong>${b.destination}</strong>` : ""
      }${b.dates ? ` · ${b.dates}` : ""}.</p>
      <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;">
        <tr><td style="padding:6px 0;color:#5b6c77;">Room</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${b.occupancy}${
          b.bedType ? ` · ${b.bedType} beds` : ""
        }</td></tr>
        <tr><td style="padding:6px 0;color:#5b6c77;">Travelers</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${b.travelers.length}</td></tr>
        <tr><td style="padding:6px 0;color:#5b6c77;">Total paid</td><td style="padding:6px 0;text-align:right;font-weight:bold;color:#0c8ea0;">${b.amountFormatted}</td></tr>
      </table>
      <p style="font-size:15px;line-height:1.6;"><strong>Next step:</strong> our trip coordinator will reach out to collect your flight details so we can arrange your round-trip airport transfers.</p>
      ${flightBlock(b)}
      <p style="font-size:15px;line-height:1.6;">Questions? Just reply to this email or reach us at <a href="mailto:${REPLY_TO}" style="color:#0c8ea0;">${REPLY_TO}</a>.</p>
      <p style="font-size:15px;line-height:1.6;margin-top:24px;">See you on the courts,<br/>The ${BRAND} Team</p>
    </div>
  </div>`;
}

function customerText(b: ParsedBooking): string {
  return [
    `You're confirmed! Thank you for booking ${BRAND}${b.destination ? ` at ${b.destination}` : ""}${b.dates ? ` (${b.dates})` : ""}.`,
    ``,
    `Room: ${b.occupancy}${b.bedType ? ` · ${b.bedType} beds` : ""}`,
    `Travelers: ${b.travelers.length}`,
    `Total paid: ${b.amountFormatted}`,
    ``,
    `Next step: our trip coordinator will reach out to collect your flight details for your airport transfers.`,
    ...(airportFor(b.destination)
      ? [
          ``,
          `Book your flights: airfare into ${airportFor(b.destination)!.label} is on you — search fares here: ${flightSearchUrl(
            { destIata: airportFor(b.destination)!.code, departDate: "", returnDate: "", passengers: b.travelers.length },
          )}`,
        ]
      : []),
    `Questions? ${REPLY_TO}`,
  ].join("\n");
}

function internalHtml(b: ParsedBooking): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#12294c;">
    <h2 style="color:#12294c;">New booking received</h2>
    <p style="font-size:14px;">
      <strong>Room:</strong> ${b.occupancy}${b.bedType ? ` · ${b.bedType} beds` : ""}<br/>
      <strong>Total paid:</strong> ${b.amountFormatted}<br/>
      <strong>Trip:</strong> ${b.destination ?? ""} ${b.dates ? `· ${b.dates}` : ""}<br/>
      <strong>Billing email:</strong> ${b.customerEmail}
    </p>
    <table style="border-collapse:collapse;font-size:13px;width:100%;">
      <thead>
        <tr style="background:#12294c;color:#fff;">
          <th style="padding:6px 10px;border:1px solid #e2e8f0;">#</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;">Passport name</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;">Preferred</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;">DOB</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;">Gender</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;">Skill</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;">Email</th>
          <th style="padding:6px 10px;border:1px solid #e2e8f0;">Phone</th>
        </tr>
      </thead>
      <tbody>${travelersTable(b)}</tbody>
    </table>
  </div>`;
}

/** Sends the customer confirmation and internal notification. Never throws. */
export async function sendBookingEmails(b: ParsedBooking): Promise<EmailResult> {
  const cfg = configure();
  if (!cfg) {
    console.warn("[email] SENDGRID_API_KEY / SENDGRID_FROM not set — skipping emails");
    return { customer: false, internal: false, skipped: true };
  }
  const result: EmailResult = { customer: false, internal: false };

  if (b.customerEmail) {
    try {
      await sgMail.send({
        to: b.customerEmail,
        from: cfg.from,
        replyTo: REPLY_TO,
        subject: `You're confirmed — ${b.destination ?? BRAND}`,
        text: customerText(b),
        html: customerHtml(b),
      });
      result.customer = true;
    } catch (err) {
      console.error("[email] customer send failed", err);
    }
  }

  try {
    await sgMail.send({
      to: REPLY_TO,
      from: cfg.from,
      replyTo: b.customerEmail || REPLY_TO,
      subject: `New booking — ${b.occupancy} — ${b.travelers[0]?.name ?? "traveler"}`,
      html: internalHtml(b),
    });
    result.internal = true;
  } catch (err) {
    console.error("[email] internal send failed", err);
  }

  return result;
}
