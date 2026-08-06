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

/**
 * Addresses copied on EVERY form notification, on top of the form's own routed
 * inbox. Comma-separated, from `FORM_NOTIFY_ALWAYS`.
 *
 * ⚠ ENV, NOT SOURCE — same rule as the `FORM_INBOX_*` vars in
 * lib/forms/routing.ts. This repo is public, so a staff address written here is
 * published permanently in git history and scrapeable.
 *
 * Added 8/6 (Wesley) so one person can watch every form's notification land and
 * confirm delivery. Deliberately ONE variable rather than appending an address
 * to each of the sixteen `FORM_INBOX_*` vars: that would be sixteen edits to add
 * and sixteen to remove, and the ones nobody remembered to revert would keep
 * sending forever. This is one line to unset when the watching is done.
 *
 * Read at call time, not at import, so setting it in Vercel takes effect on the
 * next request rather than needing a cold start to be reasoned about.
 */
function alwaysNotified(): string[] {
  return (process.env.FORM_NOTIFY_ALWAYS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Merge a form's routed inbox with the always-notified list.
 *
 * ⚠ THE ROUTED INBOX STAYS FIRST. `sendFormNotification` derives the Customer.io
 * identifier from the first address, so reordering would attribute every form's
 * send to the observer instead of the destination inbox.
 *
 * ⚠ AND AN EMPTY `to` STAYS EMPTY. A form with no inbox (newsletter-junior is
 * list-only, matching the live site) must not start emailing because someone set
 * this var — callers already skip the send when there is no routed inbox, and
 * this keeps that true if one ever stops checking.
 *
 * Dedupe is case-insensitive, so an address that is already on the routed list
 * doesn't receive two copies of the same submission.
 */
export function notifyRecipients(to: string): string {
  const routed = to
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (routed.length === 0) return "";

  const seen = new Set<string>();
  const out: string[] = [];
  for (const addr of [...routed, ...alwaysNotified()]) {
    const key = addr.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(addr);
  }
  return out.join(", ");
}

export type NotifyResult = "sent" | "skipped" | "failed";

/**
 * Send a form notification. Returns:
 *   "sent"    — Customer.io accepted it.
 *   "skipped" — CUSTOMERIO_APP_API_KEY unset (local dev / unconfigured). Not an
 *               error; the caller decides whether that should fail the request.
 *   "failed"  — configured but the send was rejected.
 *
 * `to` may be a comma-separated list, and `FORM_NOTIFY_ALWAYS` is appended to it
 * (see notifyRecipients). The Customer.io identifier has to be a single address,
 * so it takes the first one — the routed inbox — and the whole list still
 * receives the email.
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

  const to = notifyRecipients(opts.to);
  if (!to) {
    console.warn(`[${opts.label}] no recipients — email skipped`);
    return "skipped";
  }

  const res = await fetch("https://api.customer.io/v1/send/email", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      identifiers: { email: to.split(",")[0].trim() },
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
