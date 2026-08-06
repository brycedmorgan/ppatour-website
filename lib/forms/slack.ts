/**
 * The Slack mirror of a form submission — one implementation, shared by every
 * route that emails a notification.
 *
 * Added 8/6 (Wesley) to watch every non-newsletter submission land in
 * #website-form-submissions while the forms are being verified end to end.
 *
 * ⚠ THIS IS A MIRROR, NEVER A DESTINATION. The Google Sheet is the system of
 * record and the routed inbox is how the team is actually notified; this is a
 * third copy for visibility. So every failure here is swallowed — a Slack
 * outage, a revoked webhook or a rate limit must never fail a submission the
 * sheet already holds and the team was already emailed about. Nothing in this
 * file returns a status any caller acts on beyond logging.
 *
 * ⚠ WEBHOOK URL LIVES IN ENV. A Slack incoming-webhook URL is a bearer
 * credential — anyone holding it can post to the channel — and this repo is
 * public, so it is `FORM_SLACK_WEBHOOK_URL` and never a literal here. Same rule
 * as the FORM_INBOX_* addresses in ./routing.ts.
 *
 * Server-only.
 */

/**
 * Forms that never post to Slack.
 *
 * ⚠ `reporting` IS A DELIBERATE EXCLUSION, NOT AN OVERSIGHT (Wesley, 8/6). It
 * is the integrity form: anonymous-capable, and the only form on the site that
 * deliberately never sets a reply-to so a reporter can stay anonymous. It routes
 * to the integrity inbox alone. A Slack channel is a durable, searchable copy
 * whose membership can widen later without anyone revisiting this decision, so
 * a misconduct report must not be mirrored into one. Removing it from this set
 * is a decision about who may read those reports — not a cleanup.
 *
 * The two newsletter forms are excluded because Wesley asked for non-newsletter
 * submissions: they are list signups, and an email address per signup would
 * bury the actual submissions in the channel.
 */
const SLACK_EXCLUDED_FORMS = new Set(["reporting", "newsletter", "newsletter-junior"]);

/** Whether a form's submissions are mirrored to Slack. */
export function formPostsToSlack(formType: string): boolean {
  return !SLACK_EXCLUDED_FORMS.has(formType);
}

/**
 * Slack requires exactly these three escaped in message text. Everything else
 * (including `*` and `_`) is left alone — a submitter's asterisk rendering as
 * bold is cosmetic, whereas a stray `<` can swallow the rest of a line as a
 * malformed link.
 */
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Per-value cap. A message textarea can hold far more than a channel should. */
const MAX_VALUE = 700;
/** Slack's own limit is 3000 chars of text per section block. */
const MAX_SECTION = 2800;
/** Cap the blocks so a long submission can't post a wall to the channel. */
const MAX_SECTIONS = 6;

function truncate(v: string, max: number): string {
  return v.length > max ? `${v.slice(0, max - 1)}…` : v;
}

/** Group the `*Label:* value` lines into section-sized chunks. */
function chunk(lines: string[]): string[] {
  const out: string[] = [];
  let cur = "";
  for (const line of lines) {
    const next = cur ? `${cur}\n${line}` : line;
    if (next.length > MAX_SECTION && cur) {
      out.push(cur);
      cur = truncate(line, MAX_SECTION);
    } else {
      cur = truncate(next, MAX_SECTION);
    }
  }
  if (cur) out.push(cur);
  return out;
}

export type SlackResult = "posted" | "skipped" | "failed";

/**
 * Post a submission to the forms channel. Returns:
 *   "posted"  — Slack accepted it.
 *   "skipped" — excluded form, or FORM_SLACK_WEBHOOK_URL unset (local dev).
 *   "failed"  — configured but rejected/unreachable. Callers log, never fail.
 *
 * The `rows` are the same label/value pairs the notification email renders, so
 * the channel and the inbox can't show different versions of one submission.
 */
export async function postFormToSlack(opts: {
  /** Routing key, e.g. "careers". Checked against the exclusion set. */
  formType: string;
  /** Human title, e.g. "Careers Application". */
  heading: string;
  rows: [string, string][];
  submittedAtLocal: string;
  /** Log prefix, e.g. "form-submit:careers". */
  label: string;
}): Promise<SlackResult> {
  if (!formPostsToSlack(opts.formType)) return "skipped";

  const webhook = process.env.FORM_SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.warn(`[${opts.label}] FORM_SLACK_WEBHOOK_URL unset — Slack post skipped`);
    return "skipped";
  }

  const lines = opts.rows
    .filter(([, v]) => String(v ?? "").trim() !== "")
    .map(([k, v]) => `*${esc(k)}:* ${esc(truncate(String(v).trim(), MAX_VALUE))}`);

  const sections = chunk(lines.length > 0 ? lines : ["_No fields submitted._"]);
  const shown = sections.slice(0, MAX_SECTIONS);
  const clipped = sections.length > shown.length;

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: truncate(`📥 ${opts.heading}`, 150), emoji: true },
    },
    ...shown.map((text) => ({ type: "section", text: { type: "mrkdwn", text } })),
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Submitted on ppatour.com · ${esc(opts.submittedAtLocal)}${
            clipped ? " · _truncated — full submission is in the email and the sheet_" : ""
          }`,
        },
      ],
    },
  ];

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `text` is the notification/fallback line (push notifications, screen
      // readers, and any client that can't render blocks).
      body: JSON.stringify({ text: `New submission — ${opts.heading}`, blocks }),
      // ⚠ A hanging Slack must not hold the visitor's request open. The email
      // and the sheet are already done by the time this runs.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[${opts.label}] Slack post failed`, res.status, detail);
      return "failed";
    }
    return "posted";
  } catch (err) {
    console.error(`[${opts.label}] Slack post error`, err);
    return "failed";
  }
}
