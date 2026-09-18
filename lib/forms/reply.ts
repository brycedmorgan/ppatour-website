/**
 * The email a fan gets back when the site could answer their question itself.
 *
 * Same transport as the staff notification (Customer.io transactional, the
 * verified info@ppatour.com sender) so there is one sending identity for the
 * form. `reply_to` is the inbox the submission was routed to, so a reply from
 * the fan lands with the people who own the topic and not in a no-reply void.
 *
 * ⚠ Sends only what lib/forms/triage.ts produced. No template copy adds a
 * fact; the only text this file contributes is the framing (a note that a
 * person is copied, and the sign-off).
 *
 * Server-only.
 */

const FROM = "Carvana PPA Tour <info@ppatour.com>";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape, then turn bare URLs into links. Order matters: linkify the escaped text. */
function linkify(escaped: string): string {
  return escaped.replace(
    /https?:\/\/[^\s<]+[^\s<.,;:!?)]/g,
    (url) => `<a href="${url}" style="color:#228BE6;">${url}</a>`,
  );
}

export function replyEmailHtml(answer: string): string {
  const paras = answer
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;">${linkify(esc(p)).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#101d33;max-width:640px;">
    ${paras}
    <p style="margin:18px 0 0;color:#5b6472;font-size:13px;">Carvana PPA Tour · ppatour.com<br>Reply to this email and a member of the team will pick it up.</p>
  </div>`;
}

export type ReplyResult = "sent" | "skipped" | "failed";

export async function sendAutoReply(opts: {
  to: string;
  answer: string;
  /** Inbox that owns the topic; a reply from the fan goes here. */
  replyTo: string;
  label: string;
}): Promise<ReplyResult> {
  const apiKey = process.env.CUSTOMERIO_APP_API_KEY;
  if (!apiKey) {
    console.warn(`[${opts.label}] CUSTOMERIO_APP_API_KEY unset — auto-reply skipped`);
    return "skipped";
  }
  const to = opts.to.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return "skipped";

  try {
    const res = await fetch("https://api.customer.io/v1/send/email", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        identifiers: { email: to.toLowerCase() },
        from: FROM,
        reply_to: opts.replyTo,
        subject: "Re: Your question for the Carvana PPA Tour",
        body: replyEmailHtml(opts.answer),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[${opts.label}] auto-reply send failed`, res.status, await res.text().catch(() => ""));
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error(`[${opts.label}] auto-reply error`, err);
    return "failed";
  }
}
