/**
 * The form notification email — one implementation, shared by every route that
 * sends one.
 *
 * Extracted from app/api/form-submit/route.ts on 8/5 when the sponsorship form
 * needed the same email. That form has its own route (it forwards to the
 * Jackalope sales pipeline, which no other form does), so the alternative was a
 * second copy of the Customer.io call, the HTML template and the sender
 * address — three things that would then drift. This repo has been bitten by
 * exactly that shape twice (event names in three hand-typed lists; the presenter
 * fallback living in both event builders), so it is one function.
 *
 * Server-only: reads CUSTOMERIO_APP_API_KEY.
 */

/** Verified Customer.io sender. */
const FROM = "Carvana PPA Tour <info@ppatour.com>";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** The notification body: a heading and a label/value table. */
export function formEmailBody(
  heading: string,
  rows: [string, string][],
  submittedAt: string,
): string {
  const tr = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5b6472;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;color:#101d33;">${esc(v) || "—"}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#101d33;">
    <h2 style="margin:0 0 4px;">${esc(heading)}</h2>
    <p style="margin:0 0 16px;color:#5b6472;">Submitted on ppatour.com.</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="padding:6px 14px 6px 0;color:#5b6472;white-space:nowrap;">Submitted</td><td style="padding:6px 0;color:#101d33;">${esc(submittedAt)}</td></tr>
      ${tr}
    </table>
  </div>`;
}

/** Central-time stamp for the email body, from an ISO string. */
export function localTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Denver",
    dateStyle: "long",
    timeStyle: "short",
  });
}

export type NotifyResult = "sent" | "skipped" | "failed";

/**
 * Send a form notification. Returns:
 *   "sent"    — Customer.io accepted it.
 *   "skipped" — CUSTOMERIO_APP_API_KEY unset (local dev / unconfigured). Not an
 *               error; the caller decides whether that should fail the request.
 *   "failed"  — configured but the send was rejected.
 *
 * `to` may be a comma-separated list. The Customer.io identifier has to be a
 * single address, so it takes the first one — the whole list still receives it.
 */
export async function sendFormNotification(opts: {
  to: string;
  subject: string;
  heading: string;
  rows: [string, string][];
  submittedAtLocal: string;
  /** Reply-to, when the form is allowed to expose the submitter. */
  replyTo?: string;
  /** Log prefix, e.g. "form-submit:careers". */
  label: string;
}): Promise<NotifyResult> {
  const apiKey = process.env.CUSTOMERIO_APP_API_KEY;
  if (!apiKey) {
    console.warn(`[${opts.label}] CUSTOMERIO_APP_API_KEY unset — email skipped`);
    return "skipped";
  }

  const res = await fetch("https://api.customer.io/v1/send/email", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: opts.to,
      identifiers: { email: opts.to.split(",")[0].trim() },
      from: FROM,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      subject: opts.subject,
      body: formEmailBody(opts.heading, opts.rows, opts.submittedAtLocal),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[${opts.label}] email send failed`, res.status, detail);
    return "failed";
  }
  return "sent";
}
