/**
 * The contact form after triage: sheet row → Slack → inbox email → fan reply.
 *
 * Runs inside `after()` from /api/form-submit, so the visitor's request is
 * answered in milliseconds and the model call, the sends and the sheet append
 * happen once the response is gone. Every step is independent and logged; a
 * failure in one never stops the next, and the whole thing degrades to the
 * pre-triage behaviour when triage is skipped.
 *
 * Order is deliberate:
 *   1. triage       — decides category / route / answer (or skips).
 *   2. sheet        — the system of record, now with the triage columns. The
 *                     Apps Script adds any new column header on first sight.
 *   3. Slack        — the routed channel gets the submission with a status
 *                     line; when the route moved it off the marketing channel,
 *                     the marketing channel gets a mirror so #ppa-marketing-form
 *                     still shows every submission, marked as handled (Bryce,
 *                     9/17: "show that it's already been answered"). The
 *                     answer is threaded under the post; ✅ is Tyler Dodd's own
 *                     "handled" convention on that channel.
 *   4. inbox email  — to the ROUTED inbox, subject prefixed with the outcome,
 *                     the auto-reply included so a person can catch a bad one.
 *   5. fan reply    — only when there is an answer and FORM_TRIAGE_REPLY is not
 *                     off. reply_to is the routed inbox.
 *
 * ⚠ A message the triage moved to Ticketing is NOT also mailed to marketing.
 * One inbox owns it; the marketing channel's mirror is visibility, not a second
 * owner. That is the whole point of routing.
 */
import { appendToSheet } from "@/lib/google-sheet";
import { inboxFor } from "@/lib/forms/routing";
import { sendFormNotification } from "@/lib/forms/notify";
import { addReaction, channelFor, postFormToSlack, postThreadReply } from "@/lib/forms/slack";
import { sendAutoReply } from "@/lib/forms/reply";
import {
  CATEGORY_LABEL,
  ROUTE_LABEL,
  triageContact,
  triageReplyMode,
  type Route,
  type TriageResult,
} from "@/lib/forms/triage";

export type ContactSubmission = {
  heading: string;
  sheetTab: string;
  record: Record<string, string>;
  rows: [string, string][];
  submittedAtLocal: string;
  submitterEmail: string;
  submitterName: string;
  /** The inbox the topic would have gone to with no triage — the fallback. */
  topicInbox: string;
  topic: string;
  label: string;
};

const INBOX_ENV: Record<Route, string> = {
  MARKETING: "FORM_INBOX_MARKETING",
  TICKETING: "FORM_INBOX_TICKETING",
  VOLUNTEER: "FORM_INBOX_VOLUNTEER",
  PR: "FORM_INBOX_PR",
  REGISTRATIONS: "FORM_INBOX_REGISTRATIONS",
  CAREERS: "FORM_INBOX_CAREERS",
};
const CHANNEL_ENV: Record<Route, string> = {
  MARKETING: "FORM_SLACK_CHANNEL_MARKETING",
  TICKETING: "FORM_SLACK_CHANNEL_TICKETING",
  VOLUNTEER: "FORM_SLACK_CHANNEL_VOLUNTEER",
  PR: "FORM_SLACK_CHANNEL_PR",
  REGISTRATIONS: "FORM_SLACK_CHANNEL_REGISTRATIONS",
  CAREERS: "FORM_SLACK_CHANNEL_CAREERS",
};

function statusLine(t: TriageResult): string | undefined {
  const cat = t.category ? CATEGORY_LABEL[t.category] : "";
  switch (t.status) {
    case "answered":
      return `✅ *Answered automatically* · ${cat} · reply emailed to the submitter · answer in thread`;
    case "partial":
      return `🟡 *Partly answered* · ${cat} · reply emailed, answer in thread · still owed: ${t.openQuestions.join("; ")}`;
    case "routed":
      return `➡️ *Sent to ${ROUTE_LABEL[t.route ?? "MARKETING"]}* · ${cat} · no reply sent yet`;
    case "needs_human":
      return `🙋 *Needs a person* · ${cat}`;
    case "spam":
      return `🚫 *Looks like spam* · nothing sent`;
    case "skipped":
      return undefined;
  }
}

function subjectPrefix(t: TriageResult): string {
  switch (t.status) {
    case "answered":
      return "[Answered automatically] ";
    case "partial":
      return "[Partly answered] ";
    case "spam":
      return "[Spam?] ";
    default:
      return "";
  }
}

function triageRows(t: TriageResult): [string, string][] {
  if (t.status === "skipped") return [];
  const out: [string, string][] = [
    ["Triage", `${t.category ? CATEGORY_LABEL[t.category] : "—"} · ${t.status.replace("_", " ")}${t.rerouted ? ` · re-routed to ${ROUTE_LABEL[t.route ?? "MARKETING"]}` : ""}`],
  ];
  if (t.summary) out.push(["Summary", t.summary]);
  if (t.answer) out.push(["Reply sent to the submitter", t.answer]);
  if (t.openQuestions.length) out.push(["Still needs a person", t.openQuestions.join("\n")]);
  return out;
}

export async function runContactPipeline(s: ContactSubmission): Promise<void> {
  const t = await triageContact({
    firstName: s.record.firstName,
    lastName: s.record.lastName,
    email: s.submitterEmail,
    phone: s.record.phone,
    topic: s.topic,
    message: s.record.message,
  });
  console.log(`[${s.label}] triage`, {
    status: t.status,
    category: t.category,
    route: t.route,
    rerouted: t.rerouted,
    confidence: t.confidence,
    skipped: t.skippedReason,
  });

  const route: Route | null = t.status === "skipped" ? null : t.route;
  const answer = t.answer;

  // 1) Sheet — with the triage columns. Empty strings keep the row shape stable.
  const sheetRecord = {
    ...s.record,
    triageStatus: t.status,
    triageCategory: t.category ?? "",
    triageRoute: route ?? "",
    triageSummary: t.summary ?? "",
    triageAnswer: answer ?? "",
    triageOpen: t.openQuestions.join(" | "),
    triageConfidence: t.confidence ?? "",
    triageModel: t.model ?? "",
    triageNote: t.skippedReason ?? "",
  };
  const sheetOk = await appendToSheet(s.sheetTab, sheetRecord);
  if (!sheetOk) console.warn(`[${s.label}] sheet append failed`);

  // 2) Slack — routed channel, plus a mirror to the marketing channel when routed elsewhere.
  const marketingChannel = channelFor(CHANNEL_ENV.MARKETING);
  const routedChannel = route ? channelFor(CHANNEL_ENV[route]) : undefined;
  const status = statusLine(t);
  const primary = await postFormToSlack({
    formType: "contact",
    topic: s.topic,
    channel: routedChannel,
    statusText: status,
    heading: s.heading,
    rows: s.rows,
    submittedAtLocal: s.submittedAtLocal,
    label: s.label,
  });
  const posts = [primary];
  if (route && route !== "MARKETING" && marketingChannel && routedChannel && marketingChannel !== routedChannel) {
    posts.push(
      await postFormToSlack({
        formType: "contact",
        topic: s.topic,
        channel: marketingChannel,
        statusText: `${status ?? ""}${status ? " · " : ""}mirror — the ${ROUTE_LABEL[route]} channel and inbox have the original`,
        heading: s.heading,
        rows: s.rows,
        submittedAtLocal: s.submittedAtLocal,
        label: `${s.label}:mirror`,
      }),
    );
  }
  for (const p of posts) {
    if (p.status !== "posted" || !p.channel || !p.ts) continue;
    if (answer) {
      await postThreadReply({
        channel: p.channel,
        ts: p.ts,
        text: `*Reply emailed to ${s.submitterName || s.submitterEmail}:*\n\n${answer}${
          t.openQuestions.length ? `\n\n_Still owed by a person: ${t.openQuestions.join("; ")}_` : ""
        }`,
        label: s.label,
      });
    }
    if (t.status === "answered" || t.status === "routed") {
      await addReaction({ channel: p.channel, ts: p.ts, name: "white_check_mark", label: s.label });
    }
  }

  // 3) Inbox email — to the routed inbox (or the topic's own inbox when triage skipped).
  const inbox = route ? inboxFor(INBOX_ENV[route]) : s.topicInbox;
  const emailResult = await sendFormNotification({
    to: inbox,
    subject: `${subjectPrefix(t)}New Submission from PPATour.com — Contact (${s.topic || "General"})${
      t.rerouted && route ? ` → ${ROUTE_LABEL[route]}` : ""
    }`,
    heading: s.heading,
    rows: [...s.rows, ...triageRows(t)],
    submittedAtLocal: s.submittedAtLocal,
    replyTo: s.submitterEmail ? `${s.submitterName || "Submitter"} <${s.submitterEmail}>` : undefined,
    label: s.label,
  });
  if (emailResult === "failed") console.error(`[${s.label}] inbox email FAILED — the sheet and Slack still hold it`);

  // 4) The fan's reply.
  if (answer && s.submitterEmail) {
    const mode = triageReplyMode();
    if (mode === "off" || (mode === "answered" && t.status !== "answered")) {
      console.log(`[${s.label}] auto-reply drafted but not sent (FORM_TRIAGE_REPLY=${mode}, status ${t.status})`);
    } else {
      const r = await sendAutoReply({
        to: s.submitterEmail,
        answer,
        replyTo: inbox.split(",")[0].trim(),
        label: s.label,
      });
      console.log(`[${s.label}] auto-reply ${r}`);
    }
  }
}
