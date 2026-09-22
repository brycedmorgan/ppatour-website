/**
 * Sends the one-time sign-in link through SendGrid — the same service the
 * vacations flow already uses (SENDGRID_API_KEY / SENDGRID_FROM). When SendGrid
 * isn't configured (local dev), the link is logged to the server console
 * instead so the flow can still be exercised.
 */
import sgMail from "@sendgrid/mail";

export async function sendSignInEmail(to: string, link: string): Promise<void> {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM;

  if (!key || !from) {
    console.log(`[ambassadors] sign-in link for ${to}: ${link}`);
    return;
  }

  sgMail.setApiKey(key);
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0F1E2B">
      <p style="font:600 12px 'IBM Plex Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#6C7F90;margin:0 0 6px">PPA Tour · Ambassador Program</p>
      <h1 style="font-family:'Barlow Condensed',Arial,sans-serif;font-size:26px;text-transform:uppercase;margin:0 0 12px">Your ambassador dashboard</h1>
      <p style="margin:0 0 18px">Tap below to sign in. This link works once and expires in 15 minutes.</p>
      <p style="margin:0 0 22px">
        <a href="${link}" style="display:inline-block;background:#1F7FE0;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:4px">Open my dashboard</a>
      </p>
      <p style="font-size:13px;color:#6C7F90;margin:0">If you didn't request this, you can ignore it. Only emails on the ambassador roster can sign in.</p>
    </div>`;

  await sgMail.send({
    to,
    from,
    subject: "Your PPA Tour ambassador dashboard",
    text: `Sign in to your PPA Tour ambassador dashboard (works once, expires in 15 minutes): ${link}`,
    html,
  });
}
