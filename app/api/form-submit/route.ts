import { NextResponse } from "next/server";
import { FORM_SCHEMAS, type FormField, formNeedsTurnstile } from "@/lib/forms/schema";
import { FORM_ROUTING } from "@/lib/forms/routing";
import { appendToSheet } from "@/lib/google-sheet";
import { cioIdentifyAndTrack } from "@/lib/customerio";

/**
 * Generic form submission endpoint. One route serves every inquiry/application
 * form on the site: the client posts `{ formType, website (honeypot), ...fields }`,
 * validated against the shared schema (respecting conditional `showIf` rules),
 * then fans out to:
 *
 *   1. A notification email to the routed inbox (Customer.io transactional,
 *      verified info@ppatour.com sender, reply-to = submitter where allowed).
 *      Skipped when the form has no `notifyTo` (list-only signups).
 *   2. A durable row in the Google Sheet (system of record, one tab per form).
 *   3. Customer.io identify+event for marketing-relevant forms (optional).
 *
 * Degrades gracefully: unset env (local dev) → submission logged, returns ok.
 * The sheet append is best-effort so a Sheets outage never loses a lead the
 * team was emailed about.
 */
const FROM = "Carvana PPA Tour <info@ppatour.com>";

type Raw = Record<string, unknown>;

/**
 * Verify a Cloudflare Turnstile token. Returns true when verification passes,
 * or when TURNSTILE_SECRET_KEY is unset (local dev / unconfigured — the widget
 * isn't shown either, so nothing to check).
 */
async function verifyTurnstile(token: unknown, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch (err) {
    console.error("[form-submit] turnstile verify error", err);
    return false;
  }
}

function isVisible(field: FormField, raw: Raw): boolean {
  if (!field.showIf) return true;
  const v = raw[field.showIf.field];
  if (Array.isArray(v)) return v.includes(field.showIf.value);
  return v === field.showIf.value;
}

/** Flatten a field value to a display string (arrays joined, consent → Yes). */
function display(field: FormField, v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(String).join(", ");
  if (field.type === "consent") return v === "1" ? "Agreed" : "";
  return String(v).trim();
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function emailBody(heading: string, rows: [string, string][], submittedAt: string): string {
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

export async function POST(request: Request) {
  let body: Raw;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true }); // honeypot
  }

  const formType = String(body.formType ?? "");

  /**
   * Newsletter signups don't render the widget (see TURNSTILE_EXEMPT_FORMS), so
   * they can't produce a token — requiring one here would fail every signup at
   * the anti-spam gate. The honeypot above still applies to them.
   *
   * Read from the same set the client uses, so the two can't drift apart. Note
   * this runs AFTER formType is resolved; an unknown formType is not exempt and
   * still has to verify.
   */
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (formNeedsTurnstile(formType) && !(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Anti-spam check failed — please try again." }, { status: 400 });
  }

  const schema = FORM_SCHEMAS[formType];
  const routing = FORM_ROUTING[formType];
  if (!schema || !routing) {
    return NextResponse.json({ error: "Unknown form" }, { status: 400 });
  }

  const visible = schema.fields.filter((f) => f.type !== "heading" && isVisible(f, body));

  // Validate required visible fields + email format.
  for (const f of visible) {
    const raw = body[f.name];
    const empty = raw == null || (Array.isArray(raw) ? raw.length === 0 : String(raw).trim() === "") || (f.type === "consent" && raw !== "1");
    if (f.required && empty) {
      return NextResponse.json({ error: `Missing required field: ${f.label}` }, { status: 400 });
    }
    if (f.type === "email" && !empty && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(raw))) {
      return NextResponse.json({ error: `Invalid ${f.label}` }, { status: 400 });
    }
  }

  const submittedAt = new Date().toISOString();
  const submittedAtLocal = new Date(submittedAt).toLocaleString("en-US", {
    timeZone: "America/Denver",
    dateStyle: "long",
    timeStyle: "short",
  });

  // Flat record for storage + email rows for every visible field.
  const record: Record<string, string> = { submittedAt };
  const rows: [string, string][] = [];
  for (const f of visible) {
    const d = display(f, body[f.name]);
    record[f.name] = d;
    rows.push([f.label, d]);
  }

  console.log(`[form-submit:${formType}]`, record);

  // 1) Durable record — best-effort.
  const sheetOk = await appendToSheet(routing.sheetTab, record);

  // 2) Notification email (if the form routes to an inbox).
  const submitterEmail = typeof body.email === "string" ? body.email.trim() : "";
  const submitterName = `${record.firstName ?? ""} ${record.lastName ?? record.name ?? ""}`.trim();
  const notifyTo = typeof routing.notifyTo === "function" ? routing.notifyTo(record) : routing.notifyTo;

  const apiKey = process.env.CUSTOMERIO_APP_API_KEY;
  if (notifyTo && apiKey) {
    const replyTo = routing.replyToSubmitter && submitterEmail ? `${submitterName || "Submitter"} <${submitterEmail}>` : undefined;
    const emailRes = await fetch("https://api.customer.io/v1/send/email", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: notifyTo,
        identifiers: { email: notifyTo.split(",")[0].trim() },
        from: FROM,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: routing.subject(record),
        body: emailBody(schema.heading, rows, submittedAtLocal),
      }),
    });
    if (!emailRes.ok) {
      const detail = await emailRes.text().catch(() => "");
      console.error(`[form-submit:${formType}] email send failed`, emailRes.status, detail);
      return NextResponse.json({ error: "Could not submit" }, { status: 502 });
    }
  } else if (notifyTo) {
    console.warn(`[form-submit:${formType}] CUSTOMERIO_APP_API_KEY unset — email skipped (sheet ${sheetOk ? "ok" : "failed"})`);
  }

  // 3) Marketing sync — best-effort.
  if (routing.cioEvent && submitterEmail) {
    await cioIdentifyAndTrack(
      submitterEmail,
      { last_form: formType, [`${formType}_submitted`]: true, first_name: record.firstName, last_name: record.lastName },
      routing.cioEvent,
      { ...record, source: "ppatour-website" },
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
