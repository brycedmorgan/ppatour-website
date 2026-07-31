/**
 * Day-by-day ticket pricing grid, built from the real Tixr listings.
 *
 * SERVER ONLY — imports the full price snapshot (~200KB). Never import this from
 * a client component; use lib/tixr-price-index.ts for the single "from" price.
 *
 * ── WHY A GRID IS POSSIBLE AT ALL ─────────────────────────────────────────
 * Tixr sells a tour stop as one week-long PARENT listing plus a separate listing
 * per finals day:
 *
 *   Veolia PPA Cincinnati                          <- parent: grounds passes,
 *                                                     Thu–Sun courtside + VIP
 *   Veolia PPA Cincinnati Thursday - Round of 16   <- session: that day only
 *   Veolia PPA Cincinnati Friday - Quarterfinals
 *   …
 *
 * So a fan buying "just Sunday" buys from the child, while early-week grounds
 * passes and multi-day courtside live on the parent. Before this, the event page
 * only ever read the parent and showed three tiers, so single-day pricing — the
 * thing most fans want — was invisible.
 *
 * The parent<->session relation is resolved once in scripts/sync-tixr-prices.mjs
 * and stamped as `parent_event_id`, deliberately NOT re-derived here: matching it
 * needs city + date containment (Tixr's names are inconsistent — the Worlds
 * parent is "2026 World Pickleball Championships" while its sessions are "2026
 * Pickleball World Championships …", words transposed) and one definition of that
 * is enough.
 *
 * ── WHAT GOES IN A CELL ───────────────────────────────────────────────────
 * The cheapest OPEN tier for that day at that access level, and the URL of the
 * listing that actually sells it. Nothing is computed, averaged or interpolated:
 * an empty cell means Tixr has no open tier for that combination, and we render
 * a dash rather than invent a price. Same rule as the rest of the ticket work.
 */
import snapshot from "@/lib/data/tixr-ticket-prices.json";
import { ticketsHidden, tixrEventIdFrom } from "@/lib/tixr-price-index";
import {
  LEVEL_ORDER as LEVELS,
  type AccessLevel,
  type GridCell,
  type GridDay,
  type MultiDayPass,
  type TicketGrid,
} from "@/lib/ticket-grid-view";

/** Ticket names that are not general admission — mirrors lib/tixr-prices.ts. */
const NOT_ADMISSION =
  /king of the court|king'?s court|camp\b|clinic|skills lab|play with (a|the) pro|on court with|glow in the dark|family night|register here|discount|vacations/i;

type RawTicket = {
  name: string;
  sale_state?: string;
  base_price?: number | null;
  all_in_price?: number | null;
};

type RawEvent = {
  event_id: string | number;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  url?: string;
  parent_event_id?: string;
  tickets?: RawTicket[];
};

const EVENTS: RawEvent[] = (snapshot as { events?: RawEvent[] }).events ?? [];
const BY_ID = new Map(EVENTS.map((e) => [String(e.event_id), e]));

// Shape + labels come from the client-safe module so components can import them
// without dragging this file's snapshot import into the browser bundle.
export type {
  AccessLevel,
  GridCell,
  GridDay,
  MultiDayPass,
  TicketGrid,
} from "@/lib/ticket-grid-view";
export { LEVEL_ORDER, LEVEL_LABEL } from "@/lib/ticket-grid-view";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parse YYYY-MM-DD as UTC so a local timezone can't shift the weekday. */
function utc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  const a = utc(start);
  const b = utc(end);
  for (let t = a.getTime(); t <= b.getTime(); t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Which access level a tier name describes. Order matters: "Box Suite" and
 * "Platinum Lounge" both also read as premium seating, so the most specific
 * bucket has to win first.
 */
function levelOf(name: string): AccessLevel | null {
  const n = name.toLowerCase();
  if (/box suite/.test(n)) return "suite";
  if (/\bvip\b|platinum lounge/.test(n)) return "vip";
  if (/courtside/.test(n)) return "courtside";
  if (/grounds pass|weekend pass/.test(n)) return "grounds";
  return null;
}

/**
 * Weekday names a PARENT tier applies to. "Tuesday Grounds Pass" -> [Tuesday];
 * "Thursday-Sunday Courtside" -> [Thursday..Sunday]; "Weeklong VIP" -> all.
 * Returns [] when the name names no day, which means we can't place it on a
 * specific row and it belongs in the multi-day band.
 */
function weekdaysOf(name: string, allWeekdays: string[]): string[] {
  const n = name.toLowerCase();
  if (/weeklong|week long|all week/.test(n)) return allWeekdays;
  if (/weekend/.test(n)) return allWeekdays.filter((d) => d === "Saturday" || d === "Sunday");

  const found = WEEKDAYS.filter((d) => n.includes(d.toLowerCase()));
  if (found.length === 0) return [];
  // A hyphen or "to" between two day names is a range: Thursday-Sunday.
  if (found.length === 2 && /\s*(-|–|to)\s*/.test(n)) {
    const ai = WEEKDAYS.indexOf(found[0]);
    const bi = WEEKDAYS.indexOf(found[1]);
    const order = allWeekdays.length ? allWeekdays : WEEKDAYS;
    const from = order.indexOf(WEEKDAYS[Math.min(ai, bi)]);
    const to = order.indexOf(WEEKDAYS[Math.max(ai, bi)]);
    if (from !== -1 && to !== -1 && to >= from) return order.slice(from, to + 1);
  }
  return found;
}

/**
 * The round a session listing covers, normalised to the round itself.
 *
 * Tixr's session names carry the divisions too ("Friday Evening - Men's and
 * Women's Doubles Quarterfinals"), which is both too long for a table cell and
 * misleading as a day label: a finals day usually has two sessions (morning
 * singles, evening doubles) and we'd be printing one of them as if it were the
 * whole day. Both are quarterfinals, so the round is the honest label.
 */
function roundOf(sessionName: string): string | undefined {
  // Anchor on the LAST day-of-week token and read only what follows it. The event
  // title itself often contains a round word — "Veolia Pickleball National
  // Championships Thursday - Round of 16" — so scanning the whole string labels
  // every day "Championships". Stripping the parent name instead doesn't work
  // either: Tixr transposes it on the Worlds sessions ("World Pickleball" vs
  // "Pickleball World"), so the prefix doesn't match. The day token always sits
  // between the title and the round, which makes it the dependable split point.
  const days = [...sessionName.matchAll(/\b(mon|tues|wednes|thurs|fri|satur|sun)day\b/gi)];
  if (days.length === 0) return undefined;
  const last = days[days.length - 1];
  const tail = sessionName.slice((last.index ?? 0) + last[0].length);

  const m = tail.match(
    /round of \d+|quarterfinals?|semifinals?|championships?|round robin|qualifier|playoffs?/i
  );
  if (!m) return undefined;
  const round = m[0].toLowerCase();
  if (round.startsWith("round of")) return round.replace(/^round of/, "Round of");
  // Singular -> plural so a day reads "Quarterfinals", matching how it's billed.
  const canonical: Record<string, string> = {
    quarterfinal: "Quarterfinals",
    quarterfinals: "Quarterfinals",
    semifinal: "Semifinals",
    semifinals: "Semifinals",
    championship: "Championships",
    championships: "Championships",
    "round robin": "Round Robin",
    qualifier: "Qualifier",
    playoff: "Playoffs",
    playoffs: "Playoffs",
  };
  return canonical[round] ?? undefined;
}

function openAdmission(ev: RawEvent): RawTicket[] {
  return (ev.tickets ?? []).filter(
    (t) =>
      t.sale_state === "OPEN" &&
      t.base_price != null &&
      t.base_price > 0 &&
      !NOT_ADMISSION.test(t.name)
  );
}

/** Keep the cheaper of an existing cell and a candidate. */
function consider(
  cells: Partial<Record<AccessLevel, GridCell>>,
  level: AccessLevel,
  t: RawTicket,
  url: string
) {
  const price = t.base_price as number;
  const current = cells[level];
  if (!current || price < current.from) {
    cells[level] = {
      from: price,
      allIn: t.all_in_price ?? null,
      url,
      tierName: t.name,
    };
  }
}

/**
 * Build the grid for an event, given the tickets URL we already hold and the
 * event's own date range. Returns null when there's nothing real to show —
 * no Tixr listing, or no open admission tier anywhere — so callers can keep
 * rendering "Tickets Coming Soon" rather than an empty table.
 */
export function buildTicketGrid(
  ticketsUrl: string | undefined,
  startDate: string,
  endDate: string
): TicketGrid | null {
  const id = tixrEventIdFrom(ticketsUrl);
  if (!id) return null;
  // Respect the TICKETS_HIDDEN kill-switch here as well as at the call site. The
  // grid reads the raw snapshot, so it would happily publish a full price table
  // for an event we've deliberately withheld if a future caller forgot the gate.
  // One deliberate withholding should hold everywhere.
  if (ticketsHidden(ticketsUrl)) return null;
  const parent = BY_ID.get(id);
  if (!parent) return null;

  const parentUrl = parent.url ?? ticketsUrl!;
  const sessions = EVENTS.filter((e) => e.parent_event_id === id);

  // Show the event's own dates, but only those Tixr actually sells something on —
  // a seven-day stop with tickets on four days should render four rows, not three
  // empty ones.
  const dates = eachDate(startDate, endDate);
  const allWeekdays = dates.map((d) => WEEKDAYS[utc(d).getUTCDay()]);

  const byDate = new Map<string, GridDay>();
  for (const date of dates) {
    const dt = utc(date);
    byDate.set(date, {
      date,
      weekday: SHORT[dt.getUTCDay()],
      dayLabel: `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`,
      cells: {},
    });
  }

  const multiDay: MultiDayPass[] = [];

  // 1. Parent tiers. A single named day lands on that row; a range or a weeklong
  //    pass goes to the multi-day band, because putting one price on four rows
  //    would read as four separate tickets.
  for (const t of openAdmission(parent)) {
    const level = levelOf(t.name);
    if (!level) continue;
    const days = weekdaysOf(t.name, allWeekdays);
    if (days.length === 1) {
      const date = dates.find((d) => WEEKDAYS[utc(d).getUTCDay()] === days[0]);
      if (date) {
        consider(byDate.get(date)!.cells, level, t, parentUrl);
        continue;
      }
    }
    multiDay.push({
      name: t.name,
      level,
      from: t.base_price as number,
      allIn: t.all_in_price ?? null,
      url: parentUrl,
    });
  }

  // 2. Session listings. The listing's own start_date is authoritative for which
  //    day it is — more reliable than its name, and its end_date is not (Tixr
  //    stamps some evening sessions two days out).
  for (const s of sessions) {
    if (!s.start_date) continue;
    const row = byDate.get(s.start_date);
    if (!row) continue;
    const round = roundOf(s.name);
    if (round && !row.round) row.round = round;
    const url = s.url ?? parentUrl;
    for (const t of openAdmission(s)) {
      const level = levelOf(t.name);
      if (level) consider(row.cells, level, t, url);
    }
  }

  const days = dates
    .map((d) => byDate.get(d)!)
    .filter((d) => Object.keys(d.cells).length > 0);

  const levels = LEVELS.filter(
    (l) => days.some((d) => d.cells[l]) || multiDay.some((m) => m.level === l)
  );

  if (days.length === 0 && multiDay.length === 0) return null;

  // Collapse repeats of the same pass name to one "from" row. Tixr lists the same
  // product at several price points (three "Thursday-Sunday Courtside Bleacher" at
  // $170/$250/$350 — different rows of the same bleacher), and printing all three
  // reads as three different tickets.
  const collapsed = new Map<string, MultiDayPass>();
  for (const m of multiDay) {
    const existing = collapsed.get(m.name);
    if (!existing || m.from < existing.from) collapsed.set(m.name, m);
  }

  // Cheapest first within each level, so the band reads like a price list.
  const multiDayRows = [...collapsed.values()].sort(
    (a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.from - b.from
  );

  return { days, multiDay: multiDayRows, levels, hasPerDayPricing: days.length > 0 };
}
