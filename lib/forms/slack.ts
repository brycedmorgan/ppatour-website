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
 * Transport is `chat.postMessage` with a bot token, so one credential can reach
 * any channel and routing is a channel ID per destination (see below). An
 * incoming webhook is bound to a single channel at creation, so it survives only
 * as the no-token fallback.
 *
 * ⚠ BOTH CREDENTIALS LIVE IN ENV. A bot token and a webhook URL are each a
 * bearer credential, and this repo is public, so they are
 * `FORM_SLACK_BOT_TOKEN` / `FORM_SLACK_WEBHOOK_URL` and never literals here.
 * Same rule as the FORM_INBOX_* addresses in ./routing.ts.
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
 * ⚠ CHANNELS ARE NAMED BY DESTINATION, NOT BY FORM — and that is the point.
 *
 * Both tables below hold an ENV VAR NAME, and two routes that share a channel
 * name the SAME variable. Wesley, 8/6: "some per-forms will be the same as a
 * contact topic (for example: contact topic sponsorship and the specific
 * sponsorship form will be in the same channel)." Storing a channel ID per
 * route would mean the same ID written twice, and this repo's most familiar bug
 * is two hand-kept copies of one fact drifting apart (event names in three
 * lists, the presenter fallback in both builders). One variable, one channel.
 *
 * The names deliberately mirror the FORM_INBOX_* set in ./routing.ts, so
 * FORM_SLACK_CHANNEL_SPONSORSHIP is visibly the Slack counterpart of
 * FORM_INBOX_SPONSORSHIP.
 *
 * Values are channel IDs (`C…`), not names: a channel can be renamed without
 * breaking routing, and a name lookup is an extra API call per submission.
 */

/** Contact form → channel, by Inquiry Topic. Keys match ./schema.ts verbatim. */
const CONTACT_CHANNEL_ENV: Record<string, string> = {
  "Pickleball Brackets/Tournaments": "FORM_SLACK_CHANNEL_SUPPORT",
  Registrations: "FORM_SLACK_CHANNEL_REGISTRATIONS",
  Tickets: "FORM_SLACK_CHANNEL_TICKETING",
  "PBTV/Broadcasting": "FORM_SLACK_CHANNEL_BROADCAST",
  "Public Relations": "FORM_SLACK_CHANNEL_PR",
  Sponsorship: "FORM_SLACK_CHANNEL_SPONSORSHIP",
  Marketing: "FORM_SLACK_CHANNEL_MARKETING",
  "PPA Challenger": "FORM_SLACK_CHANNEL_CHALLENGER",
  Other: "FORM_SLACK_CHANNEL_MARKETING",
};

/**
 * Every other form → channel. `sponsorship` names the same variable as the
 * contact topic above, so both land in one place by construction.
 */
const FORM_CHANNEL_ENV: Record<string, string> = {
  sponsorship: "FORM_SLACK_CHANNEL_SPONSORSHIP",
  careers: "FORM_SLACK_CHANNEL_CAREERS",
  hospitality: "FORM_SLACK_CHANNEL_HOSPITALITY",
  "host-tournament": "FORM_SLACK_CHANNEL_EVENTS",
  "event-inquiry": "FORM_SLACK_CHANNEL_EVENTS",
  "private-event": "FORM_SLACK_CHANNEL_PRIVATE_EVENTS",
  ambassador: "FORM_SLACK_CHANNEL_AMBASSADOR",
  volunteer: "FORM_SLACK_CHANNEL_VOLUNTEER",
  "opt-in": "FORM_SLACK_CHANNEL_OPT_IN",
};

/**
 * Resolve the destination channel: contact topic first, then the form, then
 * `FORM_SLACK_CHANNEL_DEFAULT`.
 *
 * ⚠ EVERY LEVEL FALLS BACK RATHER THAN DROPPING. An unmapped topic, an unset
 * variable or a topic the schema gains later all land in the default channel —
 * a submission in the wrong-but-monitored channel is recoverable; one that goes
 * nowhere looks exactly like a form that isn't working. Same reasoning as the
 * `inbox()` fallback in ./routing.ts.
 */
function resolveChannel(formType: string, topic?: string): string | undefined {
  const key =
    (formType === "contact" && topic ? CONTACT_CHANNEL_ENV[topic] : undefined) ??
    FORM_CHANNEL_ENV[formType];
  const routed = key ? process.env[key]?.trim() : "";
  return routed || process.env.FORM_SLACK_CHANNEL_DEFAULT?.trim() || undefined;
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
 * Post a submission to its channel. Returns:
 *   "posted"  — Slack accepted it.
 *   "skipped" — excluded form, or no transport configured (local dev).
 *   "failed"  — configured but rejected/unreachable. Callers log, never fail.
 *
 * The `rows` are the same label/value pairs the notification email renders, so
 * the channel and the inbox can't show different versions of one submission.
 */
export async function postFormToSlack(opts: {
  /** Routing key, e.g. "careers". Checked against the exclusion set. */
  formType: string;
  /** Contact form's Inquiry Topic, which picks the channel. Ignored otherwise. */
  topic?: string;
  /** Human title, e.g. "Careers Application". */
  heading: string;
  rows: [string, string][];
  submittedAtLocal: string;
  /** Log prefix, e.g. "form-submit:careers". */
  label: string;
}): Promise<SlackResult> {
  if (!formPostsToSlack(opts.formType)) return "skipped";

  const token = process.env.FORM_SLACK_BOT_TOKEN;
  const channel = resolveChannel(opts.formType, opts.topic);
  const webhook = process.env.FORM_SLACK_WEBHOOK_URL;

  /**
   * ⚠ THE WEBHOOK IS A FALLBACK, NOT A SECOND ROUTE. An incoming webhook is
   * bound to one channel at creation, so it cannot honour any of the routing
   * above — with no bot token, everything lands in that one channel, which is
   * exactly the behaviour before per-topic routing existed. Warned, because
   * "my sponsorship posts stopped going to the sponsorship channel" should be
   * answerable from the logs.
   */
  if (!token || !channel) {
    if (!webhook) {
      console.warn(
        `[${opts.label}] no FORM_SLACK_BOT_TOKEN/channel and no FORM_SLACK_WEBHOOK_URL — Slack post skipped`,
      );
      return "skipped";
    }
    if (!token) {
      console.warn(`[${opts.label}] FORM_SLACK_BOT_TOKEN unset — posting to the webhook's channel`);
    } else {
      console.warn(
        `[${opts.label}] no channel resolved (set FORM_SLACK_CHANNEL_DEFAULT) — posting to the webhook's channel`,
      );
    }
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

  // `text` is the notification/fallback line (push notifications, screen
  // readers, and any client that can't render blocks).
  const message = { text: `New submission — ${opts.heading}`, blocks };
  const viaApi = Boolean(token && channel);

  try {
    const res = await fetch(
      viaApi ? "https://slack.com/api/chat.postMessage" : webhook!,
      {
        method: "POST",
        headers: {
          "Content-Type": viaApi ? "application/json; charset=utf-8" : "application/json",
          ...(viaApi ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(viaApi ? { channel, ...message } : message),
        // ⚠ A hanging Slack must not hold the visitor's request open. The email
        // and the sheet are already done by the time this runs.
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[${opts.label}] Slack post failed`, res.status, detail);
      return "failed";
    }

    /**
     * ⚠ chat.postMessage ANSWERS 200 WHEN IT REFUSES. `channel_not_found`,
     * `not_in_channel` and `invalid_auth` all come back as HTTP 200 with
     * `{ok:false, error}` — so checking res.ok alone would report every
     * misrouted or uninvited channel as a successful post, and the failure
     * would only ever show up as a channel that stays empty. Webhooks are the
     * opposite (plain-text "ok" body), hence the guard on `viaApi`.
     */
    if (viaApi) {
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!data?.ok) {
        console.error(
          `[${opts.label}] Slack rejected the post to ${channel}:`,
          data?.error ?? "unparseable response",
        );
        return "failed";
      }
    }
    return "posted";
  } catch (err) {
    console.error(`[${opts.label}] Slack post error`, err);
    return "failed";
  }
}
