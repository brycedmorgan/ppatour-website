/**
 * Server-only routing for each form: which inbox gets notified, the email
 * subject, the Google Sheet tab, and an optional Customer.io event. Kept
 * separate from ./schema.ts so inbox addresses never ship to the browser.
 *
 * ⚠️ Inbox ADDRESSES LIVE IN ENV, NOT IN THIS FILE. This repo is public, so
 * hardcoding staff addresses here would publish them permanently in git
 * history (scrapeable). Each route names a `FORM_INBOX_*` variable instead —
 * set them in Vercel; the full list is in docs/FORMS.md.
 *
 * Recipients mirror the live ppatour.com Gravity Forms notifications exactly
 * (export 2026-07-27) so the same people keep getting the same submissions.
 * `notifyTo` may be a function of the submission (contact routes by its Topic
 * dropdown) or undefined (list-only signups → sheet + Customer.io, no email).
 */
type Data = Record<string, string>;

export type FormRouting = {
  /** Inbox(es) that receive the notification email; undefined → no email. */
  notifyTo?: string | ((data: Data) => string);
  subject: (data: Data) => string;
  sheetTab: string;
  /** Set the submitter's email as reply-to. Off for anonymous forms. */
  replyToSubmitter?: boolean;
  /** Customer.io event name (marketing-relevant forms only). */
  cioEvent?: string;
};

/** Generic tour inbox — the only address safe to keep in source (already public). */
const DEFAULT_INBOX = "info@ppatour.com";

/**
 * Resolve a routed inbox from env at submit time (lazy, so an unset var warns
 * on use rather than at import). Falls back to the generic tour inbox: a
 * misconfigured var misroutes a lead to a real human instead of dropping it.
 * Value may be a comma-separated list.
 */
function inbox(envVar: string): string {
  const v = process.env[envVar]?.trim();
  if (v) return v;
  console.warn(`[forms] ${envVar} unset — falling back to ${DEFAULT_INBOX}`);
  return DEFAULT_INBOX;
}

// Contact form → routed per Inquiry Topic, matching the active GF notifications
// (inactive GF routes point at their designated inbox rather than being dropped).
// Keys must match the `topic` options in ./schema.ts verbatim.
const CONTACT_INBOX_ENV: Record<string, string> = {
  "Pickleball Brackets/Tournaments": "FORM_INBOX_SUPPORT",
  Registrations: "FORM_INBOX_REGISTRATIONS",
  Tickets: "FORM_INBOX_TICKETING",
  "PBTV/Broadcasting": "FORM_INBOX_BROADCAST",
  "Public Relations": "FORM_INBOX_PR",
  Sponsorship: "FORM_INBOX_SPONSORSHIP",
  Marketing: "FORM_INBOX_MARKETING",
  "PPA Challenger": "FORM_INBOX_CHALLENGER",
  Other: "FORM_INBOX_MARKETING",
};

export const FORM_ROUTING: Record<string, FormRouting> = {
  contact: {
    notifyTo: (d) => inbox(CONTACT_INBOX_ENV[d.topic ?? ""] ?? "FORM_INBOX_MARKETING"),
    subject: (d) => `New Submission from PPATour.com — Contact (${d.topic || "General"})`,
    sheetTab: "Contact",
    replyToSubmitter: true,
  },
  careers: {
    notifyTo: () => inbox("FORM_INBOX_CAREERS"),
    subject: (d) => `New submission from Careers — ${d.firstName || ""} ${d.lastName || ""}`.trim(),
    sheetTab: "Careers",
    replyToSubmitter: true,
  },
  reporting: {
    notifyTo: () => inbox("FORM_INBOX_INTEGRITY"),
    subject: () => "New submission from Report Here",
    sheetTab: "Reporting",
    replyToSubmitter: false, // anonymous-capable — never leak a reply-to
  },
  hospitality: {
    notifyTo: () => inbox("FORM_INBOX_HOSPITALITY"),
    subject: (d) => `New submission from Hospitality — ${d.firstName || ""} ${d.lastName || ""}`.trim(),
    sheetTab: "Hospitality",
    replyToSubmitter: true,
  },
  "host-tournament": {
    notifyTo: () => inbox("FORM_INBOX_EVENTS"),
    subject: (d) => `New submission from Classic Series RFP — ${d.venueName || "Venue"}`,
    sheetTab: "HostTournament",
    replyToSubmitter: true,
  },
  "event-inquiry": {
    notifyTo: () => inbox("FORM_INBOX_EVENTS"),
    subject: (d) => `New submission from PPA Tour Event Inquiry — ${d.orgName || ""}`,
    sheetTab: "EventInquiry",
    replyToSubmitter: true,
  },
  "private-event": {
    notifyTo: () => inbox("FORM_INBOX_PRIVATE_EVENTS"),
    subject: (d) => `New submission from PPA Sponsored Private Event — ${d.firstName || ""} ${d.lastName || ""}`.trim(),
    sheetTab: "PrivateEvent",
    replyToSubmitter: true,
  },
  ambassador: {
    notifyTo: () => inbox("FORM_INBOX_AMBASSADOR"),
    subject: (d) => `New submission from Ambassador Program Application — ${d.firstName || ""} ${d.lastName || ""}`.trim(),
    sheetTab: "Ambassador",
    replyToSubmitter: true,
  },
  "opt-in": {
    notifyTo: () => inbox("FORM_INBOX_OPT_IN"),
    subject: (d) => `New submission from Opt-In Form — ${d.firstName || ""} ${d.lastName || ""}`.trim(),
    sheetTab: "OptIn",
    replyToSubmitter: true,
    cioEvent: "fan_opt_in",
  },
  newsletter: {
    notifyTo: () => inbox("FORM_INBOX_NEWSLETTER"),
    subject: () => "New newsletter signup — ppatour.com",
    sheetTab: "Newsletter",
    cioEvent: "newsletter_signup",
  },
  "newsletter-junior": {
    // Junior newsletter is list-only on the live site (no notification).
    subject: () => "New Junior PPA Tour newsletter signup",
    sheetTab: "NewsletterJunior",
    cioEvent: "newsletter_junior_signup",
  },
};
