/**
 * What the contact-form auto-answer is ALLOWED to know.
 *
 * The triage model (lib/forms/triage.ts) answers a fan's question only from the
 * text this module builds. Nothing here is typed by hand for the purpose of
 * answering — every line is read from the same modules the site renders from
 * (the curated calendar, the Tixr price index, the event team's parking copy,
 * the on-site facts, the volunteer FAQ), plus a short list of site URLs.
 *
 * ⚠ THAT IS THE WHOLE SAFETY ARGUMENT, so keep it true. A fan asking whether
 * coolers are allowed gets no answer today because no surface on the site says
 * so — and the right fix is to put the policy on the site (which then lands
 * here for free), never to add a sentence to this file. The 8/5 parking purge
 * happened because hand-written operational copy quoted prices nobody had
 * sourced; an email to a fan is a worse place for that than a web page.
 *
 * Server-only. Reads the Tixr snapshot and the event guides.
 */
import { eventHref, getRemainingTourEvents, type Tournament } from "@/lib/placeholder-data";
import { ticketPriceFrom, ticketsOnSale } from "@/lib/tixr-price-index";
import { PARKING_TBA, parkingText } from "@/lib/event-guides";
import { onSiteFor } from "@/lib/onsite";
import { SITE_URL } from "@/lib/site";
import { VOLUNTEER_FAQS } from "@/lib/volunteer-faq";

/** How many upcoming stops to describe. Fans ask about the next few, not May. */
const MAX_EVENTS = 12;

function fmtDates(t: Pick<Tournament, "startDate" | "endDate">): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  const s = new Date(`${t.startDate}T12:00:00Z`);
  const e = new Date(`${t.endDate}T12:00:00Z`);
  const year = t.endDate.slice(0, 4);
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}, ${year}`;
}

function abs(path: string): string {
  return `${SITE_URL}${path}${path.endsWith("/") ? "" : "/"}`;
}

function eventBlock(t: Tournament): string {
  const lines: string[] = [];
  lines.push(`### ${t.name}`);
  lines.push(`Dates: ${fmtDates(t)}`);
  lines.push(`Where: ${t.venue ? `${t.venue}, ` : ""}${t.city}, ${t.state}`);
  lines.push(`Event page (schedule / order of play, gates and first-serve times by day, venue, where to stay, how to watch): ${abs(eventHref(t))}`);
  lines.push(`On-site guide for people at the venue: ${abs(`${eventHref(t)}/today`)}`);
  if (ticketsOnSale(t.ticketsUrl)) {
    const from = ticketPriceFrom(t.ticketsUrl);
    lines.push(`Tickets: on sale on Tixr${from ? `, from $${from}` : ""} — ${t.ticketsUrl}`);
  } else {
    lines.push("Tickets: not on sale yet (the event page will say when they are).");
  }
  if (t.registerUrl && /pickleballtournaments\.com\/.+/.test(t.registerUrl)) {
    lines.push(`Amateur registration: ${t.registerUrl}`);
  }
  const parking = parkingText(t.slug);
  lines.push(parking === PARKING_TBA ? `Parking: ${PARKING_TBA}` : `Parking:\n${parking}`);
  const on = onSiteFor(t.slug);
  if (on.entry) lines.push(`Entry / gates: ${on.entry}`);
  if (on.bagPolicy) lines.push(`Bag policy: ${on.bagPolicy}`);
  if (on.willCall) lines.push(`Will call: ${on.willCall}`);
  if (on.food) lines.push(`Food: ${on.food}`);
  if (on.note) lines.push(`Note: ${on.note}`);
  return lines.join("\n");
}

/**
 * The site facts that do not change per event. Every URL is a live route on
 * this site or a partner page the site already links to; the descriptions say
 * what the page holds, not what the answer is.
 */
function siteFacts(): string {
  return [
    "## The site",
    `Homepage: ${abs("/")}`,
    `Full schedule, every tour stop and Challenger, filters by region and points: ${abs("/events")}`,
    `Volunteer — how to apply (application form + positions + FAQ): ${abs("/events/volunteer")}`,
    `World Pickleball Rankings (WPR), full men's and women's boards, searchable by name: ${abs("/rankings")}`,
    `Deep leaderboards with paging, name search and region filter: ${abs("/leaderboards")}`,
    `How pro pickleball works — contracts, WPR weighting (gender doubles 50%, mixed doubles 35%, singles 15%, weighted across the last 52 weeks), Current Seed, draws, byes, points and prize money: ${abs("/about/how-it-works")}`,
    `Athlete profiles (rank, points, results, paddle): ${abs("/athletes")}`,
    `How to watch — PickleballTV streams every court; TV windows on Tennis Channel, FOX and FS1/FS2 are listed by event: ${abs("/watch")} and the TV schedule ${abs("/watch/tv")}`,
    `Latest news: ${abs("/news")}`,
    `Tournament history and past champions: ${abs("/about/history")}`,
    `Contact directory by department: ${abs("/about/contact")}`,
    `Sponsorship inquiries: ${abs("/about/sponsors")}`,
    `Host a tournament / bring an event to your venue: ${abs("/about/host-tournament")}`,
    `Private events, corporate pro-ams and hospitality: ${abs("/about/private-events")}`,
    `Ambassador program: ${abs("/about/ambassadors")}`,
    `Careers: ${abs("/about/careers")}`,
    `Junior PPA: ${abs("/tour/junior")} · Senior Open: ${abs("/tour/senior")} · PPA Camps: ${abs("/tour/camps")} · State Championships: ${abs("/tour/state-championships")}`,
    `Official PPA Tour merchandise is sold by Pickleball Central, the official retailer: https://pickleballcentral.com/apparel/ppa-tour-apparel/`,
    `Amateur players register for events on pickleballtournaments.com; each event page links to its own registration.`,
    `Fan app: MATCHDAY, on the App Store and Google Play, for live scores and brackets.`,
  ].join("\n");
}

function volunteerFaq(): string {
  return ["## Volunteer FAQ (the volunteer team's own words — quote, do not paraphrase)"]
    .concat(VOLUNTEER_FAQS.map((f) => `Q: ${f.q}\nA: ${f.a}`))
    .join("\n\n");
}

/**
 * The full pack, built at request time so it reflects today's calendar and the
 * current Tixr snapshot. ~8–12 KB of text.
 */
export function buildKnowledgePack(now = Date.now()): string {
  const events = getRemainingTourEvents(now).slice(0, MAX_EVENTS);
  const today = new Date(now).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Denver",
  });
  return [
    `Today is ${today}.`,
    siteFacts(),
    "## Upcoming Carvana PPA Tour stops (soonest first)",
    events.map(eventBlock).join("\n\n"),
    volunteerFaq(),
  ].join("\n\n");
}
