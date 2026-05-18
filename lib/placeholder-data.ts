/**
 * Placeholder tournament data for the Phase 2 homepage build.
 * Main-tour events only (1,000+ ranking points) — see CLAUDE_CODE_PASSOFF_v2
 * §2 "Schedule defaults to $1,000+ events". Content + imagery are interim
 * assets pulled from ppatour.com; replace with the Sanity CMS + scoring API.
 */

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
  /** Ranking points — main tour is 1,000+ */
  points: number;
  tier: string;
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
    city: "Atlanta",
    state: "GA",
    venue: "Life Time — Peachtree Corners",
    startDate: "2026-06-02",
    endDate: "2026-06-07",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    points: 1000,
    tier: "PPA Tour Main Draw",
    image: "/ppa/action-waters-bright.jpg",
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
    ticketPriceFrom: 45,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    points: 1000,
    tier: "PPA Tour Main Draw",
    image: "/ppa/action-md-final.jpg",
  },
  {
    slug: "veolia-chicago-open",
    name: "Veolia Chicago Open",
    shortName: "Chicago Open",
    city: "Chicago",
    state: "IL",
    venue: "Lifetime — Schaumburg",
    startDate: "2026-07-14",
    endDate: "2026-07-19",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    points: 1000,
    tier: "PPA Tour Main Draw",
    image: "/ppa/action-mxd.jpg",
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
    ticketPriceFrom: 35,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    points: 1000,
    tier: "PPA Tour Main Draw",
    image: "/ppa/action-masters.jpg",
  },
  {
    slug: "veolia-national-championships",
    name: "Veolia Pickleball National Championships",
    shortName: "National Championships",
    city: "Cary",
    state: "NC",
    venue: "Cary Tennis Park",
    startDate: "2026-08-31",
    endDate: "2026-09-06",
    ticketPriceFrom: 49,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    points: 2000,
    tier: "PPA Tour Grand Slam",
    image: "/ppa/action-singles.jpg",
  },
  {
    slug: "carvana-pickleball-masters",
    name: "Carvana Pickleball Masters",
    shortName: "Pickleball Masters",
    city: "Phoenix",
    state: "AZ",
    venue: "Mountain America Stadium",
    startDate: "2026-09-22",
    endDate: "2026-09-27",
    ticketPriceFrom: 55,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "upcoming",
    points: 2000,
    tier: "PPA Tour Grand Slam",
    image: "/ppa/action-champ-sunday.jpg",
  },
];

/** Next non-completed tournament, chronologically. */
export function getNextTournament(): Tournament {
  return tournaments.find((t) => t.status !== "completed") ?? tournaments[0];
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
