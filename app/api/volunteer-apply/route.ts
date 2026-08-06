import { NextResponse } from "next/server";
import { cioIdentifyAndTrack } from "@/lib/customerio";
import { notifyRecipients } from "@/lib/forms/notify";
import { postFormToSlack } from "@/lib/forms/slack";

/**
 * Volunteer application endpoint. Each submission is emailed to the
 * volunteer team via the Customer.io App API (transactional send, verified
 * `info@ppatour.com` sender, reply-to set to the applicant so the team can
 * respond directly).
 *
 * Env:
 *   CUSTOMERIO_APP_API_KEY     — required in deployed envs; when unset
 *                                (local dev) submissions are logged only.
 *   VOLUNTEER_APPLICATIONS_TO  — recipient override for testing; defaults
 *                                to the volunteer team inbox.
 *   FORM_NOTIFY_ALWAYS         — copied on every form notification site-wide.
 *
 * ⚠ This route builds its own send rather than going through
 * lib/forms/notify.ts (its body carries a different lead-in and an Application
 * Date row). It still imports `notifyRecipients` so the always-copied list can't
 * silently miss the one form that doesn't share the helper — which is exactly
 * how "I'm getting every form except that one" happens.
 */
const APPLICATIONS_TO =
  process.env.VOLUNTEER_APPLICATIONS_TO ?? "hailey.lunt@pickleball.com";
const FROM = "Carvana PPA Tour <info@ppatour.com>";

type Application = {
  firstName?: string;
  lastName?: string;
  dob?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  email?: string;
  heardAbout?: string;
  pastVolunteering?: string;
  shirtSize?: string;
  additionalInfo?: string;
  acknowledgments?: string[];
};

const REQUIRED: (keyof Application)[] = [
  "firstName",
  "lastName",
  "dob",
  "street",
  "city",
  "state",
  "zip",
  "email",
  "shirtSize",
];

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * The application as label/value pairs. Shared by the email body and the Slack
 * mirror so the channel and the inbox can't show different versions of one
 * application.
 */
function applicationRows(a: Application, applicationDate: string): [string, string][] {
  return [
    ["Application Date", new Date(applicationDate).toLocaleString("en-US", { timeZone: "America/Denver", dateStyle: "long", timeStyle: "short" })],
    ["Name", `${a.firstName} ${a.lastName}`],
    ["Date of Birth", a.dob ?? ""],
    ["Address", `${a.street}, ${a.city}, ${a.state} ${a.zip}`],
    ["Email", a.email ?? ""],
    ["How they heard about volunteering", a.heardAbout || "—"],
    ["Past volunteering", a.pastVolunteering || "—"],
    ["T-shirt size", a.shirtSize ?? ""],
    ["Additional info", a.additionalInfo || "—"],
    [
      "Acknowledgments",
      "Photo ID · sole-discretion acceptance · 2-shift minimum · waiver and release (all checked)",
    ],
  ];
}

function emailBody(a: Application, applicationDate: string): string {
  const tr = applicationRows(a, applicationDate)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5b6472;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;color:#101d33;">${esc(v)}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#101d33;">
    <h2 style="margin:0 0 4px;">New volunteer application</h2>
    <p style="margin:0 0 16px;color:#5b6472;">Submitted on ppatour.com — reply to this email to reach the applicant directly.</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${tr}</table>
  </div>`;
}

export async function POST(request: Request) {
  let payload: Application;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const missing = REQUIRED.filter((k) => !String(payload[k] ?? "").trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email!.trim())) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const applicationDate = new Date().toISOString();
  console.log("[volunteer-apply]", { ...payload, applicationDate });

  // Best-effort: put the applicant in Customer.io with a
  // `volunteer_application` event so the volunteer team can build segments
  // and automations. The email to the team below is the system of record.
  await cioIdentifyAndTrack(
    payload.email!,
    {
      first_name: payload.firstName,
      last_name: payload.lastName,
      volunteer_applicant: true,
    },
    "volunteer_application",
    {
      shirt_size: payload.shirtSize,
      heard_about: payload.heardAbout ?? "",
      application_date: applicationDate,
    },
  ).catch(() => {});

  // Slack mirror — best-effort, and BEFORE the Customer.io key check below:
  // that check returns early, so posting after it would mean no Slack copy in
  // any environment where email isn't configured.
  await postFormToSlack({
    formType: "volunteer",
    heading: "Volunteer Application",
    rows: applicationRows(payload, applicationDate),
    submittedAtLocal: new Date(applicationDate).toLocaleString("en-US", {
      timeZone: "America/Denver",
      dateStyle: "long",
      timeStyle: "short",
    }),
    label: "volunteer-apply",
  });

  const apiKey = process.env.CUSTOMERIO_APP_API_KEY;
  if (!apiKey) {
    console.warn(
      "[volunteer-apply] CUSTOMERIO_APP_API_KEY not set — submission logged only",
    );
    return NextResponse.json({ ok: true });
  }

  // Resolved per request, not at import: the routed inbox stays first (it is the
  // Customer.io identifier) and FORM_NOTIFY_ALWAYS is appended.
  const to = notifyRecipients(APPLICATIONS_TO);

  const res = await fetch("https://api.customer.io/v1/send/email", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      identifiers: { email: to.split(",")[0].trim() },
      from: FROM,
      reply_to: `${payload.firstName} ${payload.lastName} <${payload.email}>`,
      subject: `New volunteer application — ${payload.firstName} ${payload.lastName}`,
      body: emailBody(payload, applicationDate),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[volunteer-apply] Customer.io send failed", res.status, detail);
    return NextResponse.json(
      { error: "Could not submit application" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
