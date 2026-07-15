/**
 * Tournament data — mirrors the real PPA Tour 2026–27 main-tour schedule
 * (ppatour.com/schedule), 1,000+ points only on the homepage + schedule.
 *
 * Tiers follow the real PPA points structure:
 *   Worlds 3,000 · Slam 2,000 · Cup 1,500 · Open 1,000 · Challenger 125–500.
 *
 * `getMainTourEvents()` keeps Challengers off the homepage + schedule.
 * Prize money / ticket prices / venues for the unconfirmed stops are
 * representative; replace with the live calendar + Sanity CMS + scoring API.
 */

export type EventTier = "worlds" | "slam" | "cup" | "open" | "challenger";

export const TIER_META: Record<
  EventTier,
  { label: string; short: string; points: number }
> = {
  worlds: { label: "World Championship", short: "Worlds", points: 3000 },
  slam: { label: "PPA Tour Slam", short: "Slam", points: 2000 },
  cup: { label: "PPA Tour Cup", short: "Cup", points: 1500 },
  open: { label: "PPA Tour Open", short: "Open", points: 1000 },
  challenger: { label: "PPA Challenger", short: "Challenger", points: 500 },
};

/** Minimum ranking points for an event to appear on the homepage + schedule. */
export const MAIN_TOUR_MIN_POINTS = 1000;

export type Tournament = {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  venue: string;
  /** ISO date (yyyy-mm-dd) */
  startDate: string;
  endDate: string;
  ticketPriceFrom: number;
  ticketsUrl: string;
  registerUrl: string;
  status: "upcoming" | "live" | "completed";
  tierKey: EventTier;
  prizeMoney: string;
  presentedBy?: string;
  image: string;
  /** Optional real-photo gallery (paths under /public). */
  gallery?: string[];
};

/**
 * Real commerce deep links (verified against ppatour.com/schedule, Jul 15 2026).
 * Every event that has a live Tixr page or open registration must deep-link to
 * it — sending buyers to the group listing forces them to re-find the event
 * and costs conversion. The group/homepage URLs below are FALLBACKS, only for
 * stops whose pages don't exist yet; replace each fallback as pages go live.
 */
const tixrEvent = (slug: string) =>
  `https://www.tixr.com/groups/ppa/events/${slug}`;
const registerEvent = (slug: string) =>
  `https://pickleballtournaments.com/tournaments/${slug}`;

const TIXR = "https://www.tixr.com/groups/ppa/events/"; // fallback — no event page yet
const REGISTER = "https://www.pickleballtournaments.com/"; // fallback — registration not open yet

export const tournaments: Tournament[] = [
  {
    slug: "veolia-pickleball-national-championships",
    name: "Veolia Pickleball National Championships",
    shortName: "National Championships",
    city: "Cary",
    state: "NC",
    venue: "Cary Tennis Park",
    startDate: "2026-08-31",
    endDate: "2026-09-06",
    ticketPriceFrom: 59,
    ticketsUrl: tixrEvent("veolia-pickleball-national-championships-184656"),
    registerUrl: registerEvent("ppa-tour-veolia-ppa-national-championships"),
    status: "upcoming",
    tierKey: "slam",
    prizeMoney: "$300,000",
    presentedBy: "Veolia",
    image: "/ppa/nationals-drone-champcourt.jpg",
    gallery: [
      "/ppa/nationals-drone-stadium.jpg",
      "/ppa/nationals-crowd-stadium.jpg",
      "/ppa/nationals-drone-sunset.jpg",
      "/ppa/nationals-crowd-branded.jpg",
      "/ppa/nationals-drone-grounds.jpg",
      "/ppa/nationals-crowd-fans.jpg",
      "/ppa/nationals-drone-courts.jpg",
      "/ppa/nationals-action-2.jpg",
      "/ppa/nationals-crowd-1.jpg",
    ],
  },
  {
    slug: "veolia-cincinnati-cup",
    name: "Veolia Cincinnati Cup",
    shortName: "Cincinnati Cup",
    city: "Mason",
    state: "OH",
    venue: "Lindner Family Tennis Center",
    startDate: "2026-09-14",
    endDate: "2026-09-20",
    ticketPriceFrom: 49,
    ticketsUrl: tixrEvent("veolia-ppa-cincinnati-181370"),
    registerUrl: registerEvent("ppa-tour-2026-veolia-cincinnati-cup"),
    status: "upcoming",
    tierKey: "cup",
    prizeMoney: "$200,000",
    presentedBy: "Veolia",
    image: "/ppa/event-melbourne.jpg",
  },
  {
    slug: "rate-las-vegas-open",
    name: "Rate Las Vegas Open",
    shortName: "Las Vegas Open",
    city: "Las Vegas",
    state: "NV",
    venue: "Darling Tennis Center",
    startDate: "2026-09-28",
    endDate: "2026-10-04",
    ticketPriceFrom: 45,
    ticketsUrl: tixrEvent("ppa-las-vegas-178513"),
    registerUrl: registerEvent("ppa-tour-2026-rate-las-vegas-open"),
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    presentedBy: "Rate",
    image: "/ppa/action-md-final.jpg",
  },
  {
    slug: "veolia-chicago-open",
    name: "Veolia Chicago Open",
    shortName: "Chicago Open",
    city: "Northbrook",
    state: "IL",
    venue: "Life Time — Northbrook",
    startDate: "2026-10-05",
    endDate: "2026-10-11",
    ticketPriceFrom: 45,
    ticketsUrl: tixrEvent("ppa-chicago-176687"),
    registerUrl: registerEvent("ppa-tour-veolia-chicago-open"),
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    presentedBy: "Veolia",
    image: "/ppa/action-mxd.jpg",
  },
  {
    slug: "virginia-beach-open",
    name: "Virginia Beach Open",
    shortName: "Virginia Beach Open",
    city: "Virginia Beach",
    state: "VA",
    venue: "Virginia Beach Sports Center",
    startDate: "2026-10-12",
    endDate: "2026-10-18",
    ticketPriceFrom: 39,
    ticketsUrl: tixrEvent("ppa-virginia-beach-176326"),
    registerUrl: registerEvent("ppa-tour-2026-virginia-beach-open"),
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/action-masters.jpg",
  },
  {
    slug: "pickleball-world-championships",
    name: "PPA World Pickleball Championships",
    shortName: "World Championships",
    city: "Farmers Branch",
    state: "TX",
    venue: "Brookhaven Country Club",
    startDate: "2026-11-03",
    endDate: "2026-11-08",
    ticketPriceFrom: 79,
    ticketsUrl: tixrEvent("2026-world-pickleball-championships-166345"),
    registerUrl: registerEvent("2026-pickleball-world-championships"),
    status: "upcoming",
    tierKey: "worlds",
    prizeMoney: "$500,000",
    image: "/ppa/action-singles.jpg",
  },
  {
    slug: "proton-daytona-beach-open",
    name: "Proton Daytona Beach Open",
    shortName: "Daytona Beach Open",
    city: "Holly Hill",
    state: "FL",
    venue: "Pictona at Holly Hill",
    startDate: "2026-11-16",
    endDate: "2026-11-22",
    ticketPriceFrom: 39,
    ticketsUrl: tixrEvent("ppa-daytona-beach-178517"),
    registerUrl: registerEvent("ppa-tour-florida-open"),
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    presentedBy: "Proton",
    image: "/ppa/action-champ-sunday.jpg",
  },
  {
    slug: "veolia-malibu-cup",
    name: "Veolia Malibu Cup",
    shortName: "Malibu Cup",
    city: "Malibu",
    state: "CA",
    venue: "Pepperdine University",
    startDate: "2026-11-30",
    endDate: "2026-12-06",
    ticketPriceFrom: 55,
    ticketsUrl: tixrEvent("ppa-malibu-176502"),
    registerUrl: registerEvent("ppa-tour-veolia-malibu-cup"),
    status: "upcoming",
    tierKey: "cup",
    prizeMoney: "$200,000",
    presentedBy: "Veolia",
    image: "/ppa/event-macao.jpg",
  },
  {
    slug: "carvana-ppa-masters",
    name: "Carvana Pickleball Masters",
    shortName: "PPA Masters",
    city: "Palm Springs",
    state: "CA",
    venue: "Hyatt Regency Indian Wells",
    startDate: "2027-01-11",
    endDate: "2027-01-17",
    ticketPriceFrom: 59,
    ticketsUrl: TIXR,
    registerUrl: registerEvent("ppa-tour-carvana-pickleball-masters-powered-by-invited"),
    status: "upcoming",
    tierKey: "slam",
    prizeMoney: "$300,000",
    presentedBy: "Carvana",
    image: "/ppa/action-champ-sunday.jpg",
  },
  {
    slug: "minneapolis-indoor-open",
    name: "Minneapolis Indoor Open",
    shortName: "Minneapolis Open",
    city: "Lakeville",
    state: "MN",
    venue: "Life Time — Lakeville",
    startDate: "2027-01-18",
    endDate: "2027-01-24",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/action-singles.jpg",
  },
  {
    slug: "cape-coral-open",
    name: "Cape Coral Open",
    shortName: "Cape Coral Open",
    city: "Cape Coral",
    state: "FL",
    venue: "Cape Coral Racquet Club",
    startDate: "2027-02-01",
    endDate: "2027-02-07",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/event-gold-coast.webp",
  },
  {
    slug: "carvana-mesa-cup",
    name: "Carvana Mesa Cup",
    shortName: "Mesa Cup",
    city: "Mesa",
    state: "AZ",
    venue: "Bell Bank Park",
    startDate: "2027-02-15",
    endDate: "2027-02-21",
    ticketPriceFrom: 49,
    ticketsUrl: tixrEvent("ppa-mesa-195027"),
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "cup",
    prizeMoney: "$200,000",
    presentedBy: "Carvana",
    image: "/ppa/action-mxd.jpg",
  },
  {
    slug: "newport-beach-open",
    name: "Newport Beach Open",
    shortName: "Newport Beach Open",
    city: "Newport Beach",
    state: "CA",
    venue: "Tennis Club at Newport Beach",
    startDate: "2027-03-02",
    endDate: "2027-03-07",
    ticketPriceFrom: 49,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/action-waters-bright.jpg",
  },
  {
    slug: "texas-open",
    name: "Texas Open",
    shortName: "Texas Open",
    city: "McKinney",
    state: "TX",
    venue: "The Courts of McKinney",
    startDate: "2027-03-08",
    endDate: "2027-03-14",
    ticketPriceFrom: 45,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/action-md-final.jpg",
  },
  {
    slug: "greater-zion-cup",
    name: "Greater Zion Cup at Black Desert Resort",
    shortName: "Greater Zion Cup",
    city: "Ivins",
    state: "UT",
    venue: "Black Desert Resort",
    startDate: "2027-03-22",
    endDate: "2027-03-28",
    ticketPriceFrom: 49,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "cup",
    prizeMoney: "$200,000",
    image: "/ppa/event-gold-coast.webp",
  },
  {
    slug: "ppa-open",
    name: "PPA Open",
    shortName: "PPA Open",
    city: "To Be Announced",
    state: "",
    venue: "Venue TBA",
    startDate: "2027-04-05",
    endDate: "2027-04-11",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/action-mxd.jpg",
  },
  {
    slug: "sacramento-open",
    name: "Sacramento Open",
    shortName: "Sacramento Open",
    city: "Sacramento",
    state: "CA",
    venue: "Life Time — Arden",
    startDate: "2027-04-12",
    endDate: "2027-04-18",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/action-singles.jpg",
  },
  {
    slug: "atlanta-pickleball-championships",
    name: "Veolia Atlanta Pickleball Championships",
    shortName: "Atlanta Championships",
    city: "Peachtree Corners",
    state: "GA",
    venue: "Life Time — Peachtree Corners",
    startDate: "2027-04-26",
    endDate: "2027-05-02",
    ticketPriceFrom: 59,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "slam",
    prizeMoney: "$300,000",
    presentedBy: "Veolia",
    image: "/ppa/action-waters-bright.jpg",
  },
  {
    slug: "ppa-finals",
    name: "PPA Finals",
    shortName: "PPA Finals",
    city: "San Clemente",
    state: "CA",
    venue: "Life Time — Rancho San Clemente",
    startDate: "2027-05-10",
    endDate: "2027-05-16",
    ticketPriceFrom: 69,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "slam",
    prizeMoney: "$500,000",
    image: "/ppa/action-md-final.jpg",
  },
  // ── Below main-tour: a Challenger, kept so the 1,000+ filter is real.
  // Never appears on the homepage or schedule (getMainTourEvents excludes it).
  {
    slug: "atlanta-ppa-challenger",
    name: "Atlanta PPA Challenger",
    shortName: "Atlanta Challenger",
    city: "Atlanta",
    state: "GA",
    venue: "Atlanta Athletic Club",
    startDate: "2026-06-23",
    endDate: "2026-06-26",
    ticketPriceFrom: 20,
    ticketsUrl: TIXR,
    registerUrl: registerEvent("atlanta-ppa-challenger"),
    status: "upcoming",
    tierKey: "challenger",
    prizeMoney: "$25,000",
    image: "/ppa/action-mxd.jpg",
  },
];

/** Ranking points for an event, from its tier. */
export function tierPoints(t: Pick<Tournament, "tierKey">): number {
  return TIER_META[t.tierKey].points;
}

/** Short tier label, e.g. "Slam". */
export function tierShort(t: Pick<Tournament, "tierKey">): string {
  return TIER_META[t.tierKey].short;
}

/** Full tier label, e.g. "PPA Tour Slam". */
export function tierLabel(t: Pick<Tournament, "tierKey">): string {
  return TIER_META[t.tierKey].label;
}

/**
 * Main-tour events only (1,000+ points), chronological. The single source of
 * truth for the homepage + schedule — Challengers never appear on either.
 */
export function getMainTourEvents(): Tournament[] {
  return tournaments
    .filter((t) => tierPoints(t) >= MAIN_TOUR_MIN_POINTS)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Next upcoming main-tour event, chronologically. */
export function getNextTournament(): Tournament {
  const main = getMainTourEvents();
  return main.find((t) => t.status !== "completed") ?? main[0];
}

export type TickerState =
  | {
      mode: "LIVE";
      court: string;
      players: [string, string];
      score: string;
      watchUrl: string;
    }
  | {
      mode: "NEXT";
      tournamentName: string;
      eventDate: string;
      eventSlug: string;
    };

/**
 * Selection logic for the site-wide ticker (§9.1). With placeholder data
 * there is no live event, so this always returns NEXT mode. Once the scoring
 * API is wired, query live matches first and return LIVE mode if any exist.
 */
export function getTickerState(): TickerState {
  const next = getNextTournament();
  return {
    mode: "NEXT",
    tournamentName: next.shortName,
    eventDate: next.startDate,
    eventSlug: next.slug,
  };
}

/* ---- date helpers ---- */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "May 26" */
export function formatDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** "May 26–31" or "May 28 – Jun 2" */
export function formatDateRange(startIso: string, endIso: string): string {
  const [, sm] = startIso.split("-").map(Number);
  const [, em, ed] = endIso.split("-").map(Number);
  if (sm === em) return `${formatDate(startIso)}–${ed}`;
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}

/** Whole days from now until the given ISO date (floored at 0). */
export function daysUntil(iso: string): number {
  const target = new Date(`${iso}T00:00:00`).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / 86_400_000));
}
