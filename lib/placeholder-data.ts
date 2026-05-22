/**
 * Placeholder tournament data for the rebuild.
 *
 * Tiers follow the real PPA Tour points structure:
 *   Worlds 3,000 · Slam 2,000 · Cup 1,500 · Open 1,000 · Challenger 125–500.
 *
 * The homepage and schedule showcase MAIN-TOUR events only — 1,000+ points
 * (Worlds / Slam / Cup / Open). Challengers live in the data so the filter
 * is real, but `getMainTourEvents()` keeps them off both surfaces.
 *
 * Content + imagery are interim assets pulled from ppatour.com; replace with
 * the real calendar + Sanity CMS + scoring API.
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
  /** Total purse, display string. */
  prizeMoney: string;
  /** Presenting partner, if any. */
  presentedBy?: string;
  /** Path under /public */
  image: string;
};

const TIXR = "https://www.tixr.com/groups/ppa/events/";
const REGISTER = "https://www.pickleballtournaments.com/";

export const tournaments: Tournament[] = [
  {
    slug: "veolia-atlanta-championships",
    name: "Veolia Atlanta Championships",
    shortName: "Atlanta Championships",
    city: "Peachtree Corners",
    state: "GA",
    venue: "Life Time — Peachtree Corners",
    startDate: "2026-06-02",
    endDate: "2026-06-07",
    ticketPriceFrom: 45,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "slam",
    prizeMoney: "$250,000",
    presentedBy: "Veolia",
    image: "/ppa/action-waters-bright.jpg",
  },
  {
    slug: "atlanta-challenger",
    name: "Atlanta PPA Challenger",
    shortName: "Atlanta Challenger",
    city: "Atlanta",
    state: "GA",
    venue: "Atlanta Athletic Club",
    startDate: "2026-06-16",
    endDate: "2026-06-19",
    ticketPriceFrom: 20,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "challenger",
    prizeMoney: "$25,000",
    image: "/ppa/action-mxd.jpg",
  },
  {
    slug: "rate-las-vegas-open",
    name: "Rate Las Vegas Open",
    shortName: "Las Vegas Open",
    city: "Las Vegas",
    state: "NV",
    venue: "Darling Tennis Center",
    startDate: "2026-06-23",
    endDate: "2026-06-28",
    ticketPriceFrom: 49,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    presentedBy: "Rate",
    image: "/ppa/action-md-final.jpg",
  },
  {
    slug: "veolia-cincinnati-cup",
    name: "Veolia Cincinnati Cup",
    shortName: "Cincinnati Cup",
    city: "Mason",
    state: "OH",
    venue: "Lindner Family Tennis Center",
    startDate: "2026-07-07",
    endDate: "2026-07-12",
    ticketPriceFrom: 45,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "cup",
    prizeMoney: "$200,000",
    presentedBy: "Veolia",
    image: "/ppa/event-melbourne.jpg",
  },
  {
    slug: "veolia-chicago-open",
    name: "Veolia Chicago Open",
    shortName: "Chicago Open",
    city: "Schaumburg",
    state: "IL",
    venue: "Life Time — Schaumburg",
    startDate: "2026-07-14",
    endDate: "2026-07-19",
    ticketPriceFrom: 45,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    presentedBy: "Veolia",
    image: "/ppa/action-mxd.jpg",
  },
  {
    slug: "dallas-open",
    name: "Dallas Open",
    shortName: "Dallas Open",
    city: "Dallas",
    state: "TX",
    venue: "Brookhaven Country Club",
    startDate: "2026-07-28",
    endDate: "2026-08-02",
    ticketPriceFrom: 45,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/action-singles.jpg",
  },
  {
    slug: "sarasota-challenger",
    name: "Sarasota PPA Challenger",
    shortName: "Sarasota Challenger",
    city: "Sarasota",
    state: "FL",
    venue: "Payne Park Tennis Center",
    startDate: "2026-07-21",
    endDate: "2026-07-24",
    ticketPriceFrom: 20,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "challenger",
    prizeMoney: "$25,000",
    image: "/ppa/action-singles.jpg",
  },
  {
    slug: "virginia-beach-open",
    name: "Virginia Beach Open",
    shortName: "Virginia Beach Open",
    city: "Virginia Beach",
    state: "VA",
    venue: "Virginia Beach Sports Center",
    startDate: "2026-08-04",
    endDate: "2026-08-09",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/action-masters.jpg",
  },
  {
    slug: "veolia-malibu-cup",
    name: "Veolia Malibu Cup",
    shortName: "Malibu Cup",
    city: "Malibu",
    state: "CA",
    venue: "Malibu Racquet Club",
    startDate: "2026-08-18",
    endDate: "2026-08-23",
    ticketPriceFrom: 55,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "cup",
    prizeMoney: "$200,000",
    presentedBy: "Veolia",
    image: "/ppa/event-macao.jpg",
  },
  {
    slug: "mesa-cup",
    name: "Mesa Cup",
    shortName: "Mesa Cup",
    city: "Mesa",
    state: "AZ",
    venue: "Bell Bank Park",
    startDate: "2026-09-01",
    endDate: "2026-09-06",
    ticketPriceFrom: 45,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "cup",
    prizeMoney: "$200,000",
    image: "/ppa/event-gold-coast.webp",
  },
  {
    slug: "veolia-national-championships",
    name: "Veolia Pickleball National Championships",
    shortName: "National Championships",
    city: "Cary",
    state: "NC",
    venue: "Cary Tennis Park",
    startDate: "2026-09-15",
    endDate: "2026-09-20",
    ticketPriceFrom: 59,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "slam",
    prizeMoney: "$300,000",
    presentedBy: "Veolia",
    image: "/ppa/action-singles.jpg",
  },
  {
    slug: "carvana-ppa-masters",
    name: "Carvana PPA Masters",
    shortName: "PPA Masters",
    city: "Palm Springs",
    state: "CA",
    venue: "Hyatt Regency Indian Wells",
    startDate: "2026-09-29",
    endDate: "2026-10-04",
    ticketPriceFrom: 59,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "slam",
    prizeMoney: "$300,000",
    presentedBy: "Carvana",
    image: "/ppa/action-champ-sunday.jpg",
  },
  {
    slug: "pickleball-world-championships",
    name: "Pickleball World Championships",
    shortName: "World Championships",
    city: "Dallas",
    state: "TX",
    venue: "Dallas Open Tennis Center",
    startDate: "2026-10-13",
    endDate: "2026-10-18",
    ticketPriceFrom: 69,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "worlds",
    prizeMoney: "$500,000",
    image: "/ppa/action-masters.jpg",
  },
  {
    slug: "ppa-finals",
    name: "PPA Finals",
    shortName: "PPA Finals",
    city: "San Clemente",
    state: "CA",
    venue: "Life Time — Rancho San Clemente",
    startDate: "2026-10-27",
    endDate: "2026-11-01",
    ticketPriceFrom: 65,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    tierKey: "slam",
    prizeMoney: "$400,000",
    image: "/ppa/action-md-final.jpg",
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
      ticketsUrl: string;
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
    ticketsUrl: next.ticketsUrl,
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
