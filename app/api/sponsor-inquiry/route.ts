import { NextResponse } from "next/server";
import { FORM_ROUTING } from "@/lib/forms/routing";
import { localTimestamp, sendFormNotification } from "@/lib/forms/notify";
import { postFormToSlack } from "@/lib/forms/slack";
import { appendToSheet } from "@/lib/google-sheet";

/**
 * Sponsorship inquiry endpoint (/about/sponsors). Fans out four ways:
 *
 *   1. A durable row in the Google Sheet, tab "Sponsorship" (best-effort).
 *   2. A Slack mirror to the forms channel (best-effort).
 *   3. A notification email to FORM_INBOX_SPONSORSHIP, reply-to the submitter.
 *   4. A forward to the internal Jackalope sales app (server-to-server,
 *      shared-secret header), where it lands as a deal under Leads.
 *
 * ⚠ THE ORDER IS THE POINT (Wesley, 8/5: keep the Jackalope forward, add the
 * email and the sheet). Until now the Jackalope hook was the ONLY destination,
 * and the route 502s when it fails — so an outage in the sales app meant the
 * highest-value submission on the site existed nowhere but a Vercel log line.
 * Every other form on the site writes its durable record first for exactly this
 * reason. The sheet and the email now happen BEFORE the forward, so the lead
 * survives a Jackalope failure. The 502 itself is unchanged: a broken
 * integration should still be visible rather than silently swallowed.
 *
 * ⚠ Which does mean a visitor who retries after a 502 can produce a duplicate
 * sheet row and a second email. That is the deliberate trade — a duplicate is
 * recoverable, a lost sponsorship lead is not.
 *
 * ⚠ Routing is NOT hardcoded here. It reads FORM_ROUTING.sponsorship so the
 * inbox, subject and sheet tab sit in the same table as every other form. There
 * is no matching FORM_SCHEMAS entry, which is what keeps /api/form-submit from
 * accepting `formType=sponsorship`.
 *
 * Env: LEAD_HOOK_SECRET (shared with Jackalope), JACKALOPE_LEADS_URL (defaults
 * to the production hook), FORM_INBOX_SPONSORSHIP, CUSTOMERIO_APP_API_KEY,
 * FORM_SHEET_WEBHOOK_URL + FORM_SHEET_SECRET.
 */
const LEADS_URL =
  process.env.JACKALOPE_LEADS_URL ??
  "https://jackalopehq.vercel.app/api/leads/hook";

const ROUTING = FORM_ROUTING.sponsorship;

type Inquiry = {
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  budget?: string;
  message?: string;
  website?: string; // honeypot
};

export async function POST(request: Request) {
  let b: Inquiry;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (b.website) return NextResponse.json({ ok: true }); // honeypot hit — pretend success

  const company = b.company?.trim();
  const email = b.email?.trim();
  if (!company || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Company and a valid email are required" },
      { status: 400 },
    );
  }

  // Field order matches the form, so the sheet columns and the email table read
  // the way the visitor filled it in.
  const submittedAt = new Date().toISOString();
  const rows: [string, string][] = [
    ["Company", company],
    ["Name", b.name?.trim() ?? ""],
    ["Email", email],
    ["Phone", b.phone?.trim() ?? ""],
    ["Category", b.category?.trim() ?? ""],
    ["Budget", b.budget?.trim() ?? ""],
    ["Message", b.message?.trim() ?? ""],
  ];
  const record: Record<string, string> = { submittedAt };
  for (const [label, value] of rows) {
    record[label.toLowerCase()] = value;
  }

  console.log("[sponsor-inquiry]", record);

  // 1) Durable record — best-effort, and first, so nothing below can lose it.
  const sheetOk = await appendToSheet(ROUTING.sheetTab, record);

  // 2) Slack mirror — best-effort, and before both the email and the Jackalope
  //    forward, either of which can fail this request.
  await postFormToSlack({
    formType: "sponsorship",
    heading: "Sponsorship Inquiry",
    rows,
    submittedAtLocal: localTimestamp(submittedAt),
    label: "sponsor-inquiry",
  });

  // 3) Notification email. Non-fatal on its own: the row is already written and
  //    the Jackalope forward below is still the primary destination, so a mail
  //    outage must not fail a lead that reached the pipeline.
  const notifyTo =
    typeof ROUTING.notifyTo === "function" ? ROUTING.notifyTo(record) : ROUTING.notifyTo;
  if (notifyTo) {
    const result = await sendFormNotification({
      to: notifyTo,
      subject: ROUTING.subject(record),
      heading: "Sponsorship Inquiry",
      rows,
      submittedAtLocal: localTimestamp(submittedAt),
      replyTo: `${b.name?.trim() || company} <${email}>`,
      label: "sponsor-inquiry",
    });
    if (result !== "sent") {
      console.warn(
        `[sponsor-inquiry] notification ${result} (sheet ${sheetOk ? "ok" : "failed"})`,
      );
    }
  }

  // 4) Jackalope sales pipeline — unchanged, including the 502 on failure.
  const secret = process.env.LEAD_HOOK_SECRET;
  if (!secret) {
    // Not configured (previews today) — the sheet row and the email above still
    // captured it, so this is a warning rather than a lost lead.
    console.warn("[sponsor-inquiry] LEAD_HOOK_SECRET unset; not forwarded to Jackalope", {
      company,
      email,
      sheetOk,
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch(LEADS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-lead-secret": secret,
      },
      body: JSON.stringify({
        company,
        name: b.name,
        email,
        phone: b.phone,
        category: b.category,
        budget: b.budget,
        message: b.message,
        source: "ppatour.com sponsorship form",
      }),
    });
    if (!res.ok) throw new Error(`hook ${res.status}`);
  } catch (err) {
    console.error("[sponsor-inquiry] forward failed", err, { company, email });
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
