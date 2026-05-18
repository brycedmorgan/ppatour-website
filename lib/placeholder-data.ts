/**
 * Placeholder tournament data for the Phase 2 homepage build.
 * Content + imagery pulled from the current ppatour.com as interim assets.
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
  /** Path under /public */
  image: string;
};

export const tournaments: Tournament[] = [
  {
    slug: "macao-championships",
    name: "PPA Tour: Macao Championships",
    shortName: "Macao Championships",
    city: "Macao",
    state: "China",
    venue: "Macao Eastern Arena",
    startDate: "2026-05-27",
    endDate: "2026-05-31",
    ticketPriceFrom: 39,
    ticketsUrl: "https://www.tixr.com/groups/ppa/events/",
    registerUrl: "https://www.pickleballtournaments.com/",
    status: "upcoming",
    tier: "PPA Tour International",
    image: "/ppa/event-macao.jpg",
  },
  {
    slug: "melbourne-slam",
    name: "PPA Tour: Melbourne Slam",
    shortName: "Melbourne Slam",
    city: "Melbourne",
    state: "Australia",
    venue: "Melbourne Park",
    startDate: "2026-07-15",
    endDate: "2026-07-19",
    ticketPriceFrom: 45,
    ticketsUrl: "https://www.tixr.com/groups/ppa/events/",
    registerUrl: "https://www.pickleballtournaments.com/",
    status: "upcoming",
    tier: "PPA Tour Slam",
    image: "/ppa/event-melbourne.jpg",
  },
  {
    slug: "gold-coast-cup",
    name: "PPA Tour: Gold Coast Cup",
    shortName: "Gold Coast Cup",
    city: "Gold Coast",
    state: "Australia",
    venue: "Gold Coast Sports Precinct",
    startDate: "2026-08-13",
    endDate: "2026-08-16",
    ticketPriceFrom: 39,
    ticketsUrl: "https://www.tixr.com/groups/ppa/events/",
    registerUrl: "https://www.pickleballtournaments.com/",
    status: "upcoming",
    tier: "PPA Tour Cup",
    image: "/ppa/event-gold-coast.webp",
  },
];

/** Next non-completed tournament, chronologically. */
export function getNextTournament(): Tournament {
  return tournaments.find((t) => t.status !== "completed") ?? tournaments[0];
}

/** Upcoming tournaments for the homepage "Next Stop" rail. */
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
