/**
 * Placeholder tournament data for the Phase 2 homepage build.
 * Replace with the Sanity CMS client + scoring API once those are wired
 * (see CLAUDE_CODE_PASSOFF_v2.md §11).
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
  tier: string;
};

export const tournaments: Tournament[] = [
  {
    slug: "north-carolina-open",
    name: "PPA Tour: North Carolina Open",
    shortName: "North Carolina Open",
    city: "Raleigh",
    state: "NC",
    venue: "Life Time — Raleigh",
    startDate: "2026-05-26",
    endDate: "2026-05-31",
    ticketPriceFrom: 29,
    ticketsUrl: "https://www.tixr.com/",
    registerUrl: "https://www.pickleballtournaments.com/",
    status: "upcoming",
    tier: "PPA Tour Open",
  },
  {
    slug: "veolia-atlanta-championships",
    name: "Veolia Atlanta Championships",
    shortName: "Atlanta Championships",
    city: "Atlanta",
    state: "GA",
    venue: "Life Time — Peachtree Corners",
    startDate: "2026-06-09",
    endDate: "2026-06-14",
    ticketPriceFrom: 39,
    ticketsUrl: "https://www.tixr.com/",
    registerUrl: "https://www.pickleballtournaments.com/",
    status: "upcoming",
    tier: "PPA Tour Championship",
  },
  {
    slug: "greater-zion-open",
    name: "PPA Tour: Greater Zion Open",
    shortName: "Greater Zion Open",
    city: "St. George",
    state: "UT",
    venue: "Little Valley Pickleball Complex",
    startDate: "2026-06-23",
    endDate: "2026-06-28",
    ticketPriceFrom: 29,
    ticketsUrl: "https://www.tixr.com/",
    registerUrl: "https://www.pickleballtournaments.com/",
    status: "upcoming",
    tier: "PPA Tour Open",
  },
];

/** Next non-completed tournament, chronologically. */
export function getNextTournament(): Tournament {
  return (
    tournaments.find((t) => t.status !== "completed") ?? tournaments[0]
  );
}

/** Upcoming tournaments for the homepage "Next Stop" stack. */
export function getUpcomingTournaments(limit = 3): Tournament[] {
  return tournaments.filter((t) => t.status !== "completed").slice(0, limit);
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
