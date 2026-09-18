/**
 * Contact-form triage: what is this message, who should get it, and can the
 * site answer it itself.
 *
 * Bryce, 9/17, on #ppa-marketing-form: ticket questions should go straight to
 * the ticketing team, volunteer questions to the volunteer team, and the
 * questions marketing answers by hand every week ("what time do the pros start
 * Friday", "how do I volunteer", "where do I see singles-only rankings") should
 * be answered automatically — with the channel still showing every submission,
 * marked as already handled, so the pattern of questions can shape the website.
 *
 * Three outputs, each with a fail-safe:
 *
 *   category  — one of CATEGORIES. Always produced when the model runs; the
 *               sheet and the Slack post carry it, which is the "what do people
 *               ask" record Bryce wants.
 *   route     — derived IN CODE from the category (ROUTE_BY_CATEGORY), never
 *               taken from the model, so where a message goes is a table a
 *               person can read and change. A re-route only ever applies when
 *               the submitter picked one of the catch-all topics (Other /
 *               Marketing); a person who chose "Tickets" is believed.
 *   answer    — text for an email back to the submitter, or null. The model
 *               may only answer from lib/forms/knowledge.ts, and only for the
 *               categories in ANSWERABLE. Anything it cannot answer from the
 *               pack goes in `open_questions` and a person still gets the mail.
 *
 * ⚠ EVERY FAILURE DEGRADES TO TODAY'S BEHAVIOUR. No key, a timeout, a refusal,
 * a malformed response → status "skipped", the submission routes by its topic
 * exactly as it did before this file existed. Nothing here can lose a message.
 *
 * Env:
 *   ANTHROPIC_API_KEY   — required for the model to run at all.
 *   FORM_TRIAGE         — "off" disables triage entirely (default on when a key
 *                         is set).
 *   FORM_TRIAGE_REPLY   — "off" keeps tagging + routing but never emails a
 *                         submitter (the answer still lands in Slack + the sheet).
 *   FORM_TRIAGE_MODEL   — override the model id.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { buildKnowledgePack } from "./knowledge";

export const CATEGORIES = [
  "tickets",
  "volunteer",
  "event_info",
  "rankings",
  "registration",
  "media",
  "partnership",
  "vendor",
  "donation",
  "feedback",
  "legal",
  "careers",
  "spam",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Where a category's mail and Slack post go. Keys are FORM_INBOX_* / FORM_SLACK_CHANNEL_* suffixes. */
export const ROUTES = ["MARKETING", "TICKETING", "VOLUNTEER", "PR", "REGISTRATIONS", "CAREERS"] as const;
export type Route = (typeof ROUTES)[number];

export const ROUTE_BY_CATEGORY: Record<Category, Route> = {
  tickets: "TICKETING",
  volunteer: "VOLUNTEER",
  event_info: "MARKETING",
  rankings: "MARKETING",
  registration: "REGISTRATIONS",
  media: "PR",
  partnership: "MARKETING",
  vendor: "MARKETING",
  donation: "MARKETING",
  feedback: "MARKETING",
  legal: "MARKETING",
  careers: "CAREERS",
  spam: "MARKETING",
  other: "MARKETING",
};

/** Human labels for Slack and email. */
export const ROUTE_LABEL: Record<Route, string> = {
  MARKETING: "Marketing",
  TICKETING: "Ticketing",
  VOLUNTEER: "Volunteer team",
  PR: "PR",
  REGISTRATIONS: "Registrations",
  CAREERS: "Careers",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  tickets: "Tickets",
  volunteer: "Volunteer",
  event_info: "Event info",
  rankings: "Rankings",
  registration: "Registration",
  media: "Media / press",
  partnership: "Partnership",
  vendor: "Vendor pitch",
  donation: "Donation request",
  feedback: "Feedback",
  legal: "Legal",
  careers: "Careers",
  spam: "Spam",
  other: "Other",
};

/**
 * Categories the site is allowed to answer. Everything else is a person's job
 * even when the model could draft something plausible: a refund, a complaint
 * about a pro, a licensing claim, a sponsorship pitch.
 *
 * `volunteer` is here on purpose — "how do I sign up" is answered by a link to
 * the application, and the submission STILL routes to the volunteer team so
 * they own the relationship from the first reply.
 */
const ANSWERABLE = new Set<Category>(["event_info", "volunteer", "rankings", "registration", "other"]);

/** Topics on the contact form that mean "I didn't know who to pick". Keys match lib/forms/schema.ts. */
const CATCH_ALL_TOPICS = new Set(["Other", "Marketing", ""]);

export type TriageStatus = "answered" | "partial" | "routed" | "needs_human" | "spam" | "skipped";

export type TriageResult = {
  status: TriageStatus;
  category: Category | null;
  /** Where it goes after triage. Equals the topic's own route when no re-route applied. */
  route: Route | null;
  /** True when triage moved the message off the submitter's chosen topic. */
  rerouted: boolean;
  summary: string | null;
  answer: string | null;
  openQuestions: string[];
  confidence: "high" | "medium" | "low" | null;
  model: string | null;
  /** Why status is "skipped", for the log and the sheet. */
  skippedReason?: string;
};

const Output = z.object({
  category: z.enum(CATEGORIES),
  summary: z.string().describe("One line, under 100 characters, stating what the person wants. For the Slack post."),
  answer: z
    .string()
    .nullable()
    .describe("The email reply, or null when a person should answer. Plain text; paragraphs separated by a blank line; URLs bare."),
  open_questions: z
    .array(z.string())
    .describe("Each thing the person asked that the knowledge pack cannot answer. Empty when the answer covers everything."),
  confidence: z.enum(["high", "medium", "low"]),
});

const MODEL = () => process.env.FORM_TRIAGE_MODEL?.trim() || "claude-opus-5";

export function triageEnabled(): boolean {
  if (process.env.FORM_TRIAGE?.trim().toLowerCase() === "off") return false;
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * off       — never email a submitter (answers still land in Slack + the sheet).
 * answered  — email only when the answer covers everything (status "answered");
 *             a partial answer stays in the Slack thread for a person to finish.
 * on/unset  — email answered AND partial replies.
 * The 9/18 replay over 38 real questions: 4 answered, 9 partial, all grounded —
 * "answered" is the setting to start on.
 */
export type ReplyMode = "off" | "answered" | "on";
export function triageReplyMode(): ReplyMode {
  const v = process.env.FORM_TRIAGE_REPLY?.trim().toLowerCase();
  return v === "off" ? "off" : v === "answered" ? "answered" : "on";
}
export function triageReplyEnabled(): boolean {
  return triageReplyMode() !== "off";
}

/** Where a contact topic goes with no triage at all — the pre-triage routing, as a Route. */
export function routeForTopic(topic: string | undefined): Route {
  switch (topic) {
    case "Tickets":
      return "TICKETING";
    case "Public Relations":
      return "PR";
    case "Registrations":
      return "REGISTRATIONS";
    default:
      return "MARKETING";
  }
}

const SYSTEM = `You triage messages sent through the "Got a Question?" contact form on ppatour.com, the website of the Carvana PPA Tour (professional pickleball). You do two things: classify the message, and — only when the knowledge pack below genuinely contains the answer — write a short reply the site will email back to the person.

Classify with one category:
- tickets: anything about tickets the person holds or wants — seats, refunds, exchanges, a rescheduled or cancelled event, will call, VIP or courtside access, which ticket to buy for which day, group tickets.
- volunteer: wants to volunteer, asks how, or has applied and is waiting to hear back.
- event_info: practical questions about attending — schedule and start times, gates, venue, directions, parking, RV or overnight parking, what is allowed in, food and drink, shade, weather, autographs, watching from home.
- rankings: the World Pickleball Rankings, points, how the formula works, a specific player's rank or stats, records.
- registration: playing in an event as an amateur, senior, junior or pro qualifier — brackets, divisions, deadlines, DUPR, pickleballtournaments.com.
- media: press credentials, interviews, photography, a journalist or broadcaster.
- partnership: sponsorship, a business collaboration, a speaker or player appearance request, a mascot or entertainment offer, an organization proposing to work with the tour.
- vendor: someone selling the tour a product or service.
- donation: asking the tour to donate, support a fundraiser or charity, or provide equipment.
- feedback: compliments, complaints, opinions about players, commentators, rules, broadcasts or the website; no question that needs an answer.
- legal: licensing, copyright, trademarks, a legal claim or demand.
- careers: jobs, internships, applying to work for the tour.
- spam: SEO or guest-post offers, link buying, unrelated commercial mail.
- other: a real question that fits none of the above.

Whether to answer:
- Write an answer ONLY for event_info, volunteer, rankings, registration and other, and ONLY when the knowledge pack contains the fact or the page that answers it. Otherwise set answer to null.
- Never answer tickets, media, partnership, vendor, donation, feedback, legal, careers or spam. A person replies to those.
- Never invent a fact, a policy, a price, a time, a date or a name. If the pack does not say whether coolers, umbrellas, chairs, pets, re-entry, alcohol, cameras, strollers or bags are allowed, whether seats are shaded, what the weather will be, or when a specific match is, do not say. Put it in open_questions instead.
- When the person names a city or an event, use the SOONEST upcoming stop in that city from the pack (a September question about "the Mesa event" means the stop in Mesa that is happening now or next, not a later one whose name contains the word). If two stops fit, name both.
- Quote only the FAQ entries that answer what was asked. Do not add the age rule or other entries unprompted.
- Parking copy in the pack may say "see map below"; the map is on the event page, so say that and give the event page URL rather than repeating those words.
- Pointing the person at the page that holds the answer IS a valid answer when the pack says the page holds it (for example: the day-by-day order of play with gates and first-serve times is on the event page). Give the exact URL from the pack.
- Anything about a person's own order, seat, purchase or refund is tickets, never answered here.
- If the person asks several things, answer the ones the pack covers and list the rest in open_questions. If nothing is answerable, answer is null.
- Volunteer questions: answer "how do I volunteer / do you use volunteers" with the volunteer page link and the relevant FAQ entry, quoted. For "I applied and have not heard back", quote the FAQ entry about next steps and say the volunteer team has their note. The submission also goes to the volunteer team regardless.

How to write an answer:
- Address the person by first name. Plain, warm, direct. Three to six sentences. No exclamation marks, no emoji, no marketing language.
- Quote policy from the pack rather than restating it. Include bare URLs; do not describe a link without giving it.
- End with a single line offering that a member of the team is copied and will follow up if anything is missing. Do not sign with a name. Do not add a subject line or a greeting header beyond "Hi <first name>,".
- Write in English. If the message is in another language, set answer to null.

summary: one line, under 100 characters, present tense, e.g. "Asks whether coolers are allowed at Mesa" or "Wants to volunteer at Virginia Beach".
confidence: how sure you are of the category. Use low when the message is ambiguous or nearly empty.`;

function firstName(s: string | undefined): string {
  return (s || "").trim().split(/\s+/)[0] || "there";
}

type Input = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  topic?: string;
  message?: string;
};

/**
 * Classify + maybe answer one contact submission. Never throws.
 */
export async function triageContact(input: Input, opts: { now?: number } = {}): Promise<TriageResult> {
  const skipped = (reason: string): TriageResult => ({
    status: "skipped",
    category: null,
    route: null,
    rerouted: false,
    summary: null,
    answer: null,
    openQuestions: [],
    confidence: null,
    model: null,
    skippedReason: reason,
  });

  if (!triageEnabled()) return skipped(process.env.ANTHROPIC_API_KEY ? "FORM_TRIAGE=off" : "ANTHROPIC_API_KEY unset");
  const message = (input.message || "").trim();
  if (!message) return skipped("empty message");

  let pack: string;
  try {
    pack = buildKnowledgePack(opts.now);
  } catch (err) {
    console.error("[triage] knowledge pack failed", err);
    return skipped("knowledge pack failed");
  }

  const client = new Anthropic({ maxRetries: 1, timeout: 40_000 });
  const model = MODEL();
  const user = [
    `Submitted topic (the person's own pick from the dropdown): ${input.topic || "(none)"}`,
    `First name: ${input.firstName || "(none)"}`,
    `Last name: ${input.lastName || "(none)"}`,
    `Email domain: ${(input.email || "").split("@")[1] || "(none)"}`,
    "",
    "Message:",
    message,
  ].join("\n");

  try {
    const res = await client.messages.parse({
      model,
      max_tokens: 2048,
      output_config: { effort: "low", format: zodOutputFormat(Output) },
      system: [
        { type: "text", text: SYSTEM },
        { type: "text", text: `# Knowledge pack\n\n${pack}`, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: user }],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) {
      return skipped(res.stop_reason === "refusal" ? "model refused" : "unparseable output");
    }
    const out = res.parsed_output;
    const category = out.category;
    const topicRoute = routeForTopic(input.topic);
    const catchAll = CATCH_ALL_TOPICS.has(input.topic || "");
    const route = catchAll ? ROUTE_BY_CATEGORY[category] : topicRoute;
    const rerouted = route !== topicRoute;

    // The model is told the rules; the code enforces them anyway.
    let answer = ANSWERABLE.has(category) && catchAll ? (out.answer?.trim() || null) : null;
    if (answer && !answer.toLowerCase().startsWith("hi ")) {
      answer = `Hi ${firstName(input.firstName)},\n\n${answer}`;
    }
    const openQuestions = out.open_questions.map((q) => q.trim()).filter(Boolean);

    let status: TriageStatus;
    if (category === "spam") status = "spam";
    else if (answer && openQuestions.length === 0) status = "answered";
    else if (answer) status = "partial";
    else if (route !== "MARKETING") status = "routed";
    else status = "needs_human";

    return {
      status,
      category,
      route,
      rerouted,
      summary: out.summary.trim().slice(0, 140) || null,
      answer,
      openQuestions,
      confidence: out.confidence,
      model: res.model || model,
    };
  } catch (err) {
    const msg = err instanceof Anthropic.APIError ? `Claude ${err.status}: ${err.message}` : String((err as Error)?.message || err);
    console.error("[triage] model call failed", msg);
    return skipped(msg.slice(0, 200));
  }
}
