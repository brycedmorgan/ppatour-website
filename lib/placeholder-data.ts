/**
 * Tournament data — the PPA Tour 2026–27 season (main tour, Challengers, and
 * international stops) plus recent completed events for the /events Past tab.
 *
 * Tiers follow the real PPA points structure:
 *   Worlds 3,000 · Slam 2,000 · Cup 1,500 · Open 1,000 · Challenger 125–500.
 *
 * `getMainTourEvents()` keeps Challengers + international off the homepage.
 * Upcoming events use generic action photos as placeholders — replace with the
 * live calendar + real event art via the CMS / API.
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
  /** Per-event brand system (colors + optional icon) used on the event page. */
  brand?: { primary: string; accent: string; icon?: string };
  /** International-tour events (for the /events category filter). Domestic if unset. */
  region?: "international";
  /** Country/region for international events (matches the Country filter). */
  country?: "Asia" | "Australia" | "Canada" | "Italy" | "Spain";
  /** Season label for completed events (matches the Season filter). */
  season?: "2025-2026" | "2025" | "2024" | "2023" | "2022";
  /** Stable Pickleball.com tournament UUID (API-sourced events only). */
  tournamentUuid?: string;
  /** External details/registration page (pickleballtournaments.com) from the API. */
  externalUrl?: string;
  /**
   * Whether this event has a rich internal `/events/[slug]` page. Curated events
   * and API events run by the US org ("Pro Pickleball Association") do; other
   * API events (international sister tours) link out to {@link externalUrl}.
   */
  hasInternalPage?: boolean;
  /** API `logo_url` (square event mark), when available. */
  logoUrl?: string;
  /** Where this record came from — the live API or the curated fallback. */
  source?: "api" | "curated";
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

/* ---- schedule builder ---- */

// Generic action photos, cycled across upcoming events until real art lands.
export const GENERIC_IMAGES = [
  "/ppa/action-md-final.jpg",
  "/ppa/action-mxd.jpg",
  "/ppa/action-singles.jpg",
  "/ppa/action-champ-sunday.jpg",
  "/ppa/action-waters-bright.jpg",
  "/ppa/action-masters.jpg",
];

/**
 * Venue/stadium scenes for MAIN-TOUR event cards (Connor, 7/20: events lead
 * with venue/aerial photography, not player shots; the Nationals page is the
 * reference standard). Only three generic venue placeholders exist today —
 * every event still needing real venue/aerial art is listed in
 * docs/VENUE-ASSETS.md for Sadie's venue-asset pipeline.
 */
export const VENUE_IMAGES = [
  "/ppa/event-melbourne.jpg",
  "/ppa/event-macao.jpg",
  "/ppa/event-gold-coast.webp",
];

// Real venue photo galleries per event (restored for Nationals — the drone
// aerials + crowd set from Bryce's DRONE PHOTOS.zip; the flip-through gallery
// renders whenever an event has one).
const GALLERY_BY_SLUG: Record<string, string[]> = {
  "veolia-pickleball-national-championships": [
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
};

export const TIER_PRICE: Record<EventTier, number> = {
  worlds: 79,
  slam: 59,
  cup: 49,
  open: 39,
  challenger: 20,
};
// Official 2026 tier totals — prize money + appearance fees
// (ppatour.com/how-it-works; Bryce 7/15: show the full player payout).
export const TIER_PRIZE: Record<EventTier, string> = {
  worlds: "$1,648,641",
  slam: "$1,648,641",
  cup: "$1,271,734",
  open: "$1,063,327",
  challenger: "$25,000",
};
export const SPONSORS = ["Veolia", "Carvana", "Rate", "Proton"];

export function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type RawEvent = {
  name: string;
  short: string;
  start: string;
  end: string;
  city: string;
  state: string;
  venue?: string;
  type: "ppa" | "challenger" | "international";
  tier?: EventTier;
  country?: Tournament["country"];
  image?: string;
};

// Badge-matched brand colors + icons per event (keyed by generated slug).
const BRAND_BY_SLUG: Record<string, { primary: string; accent: string; icon?: string }> = {
  "veolia-pickleball-national-championships": { primary: "#023155", accent: "#C1272D", icon: "/ppa/badges/nationals.png" },
  "rate-las-vegas-open": { primary: "#003058", accent: "#2088e0", icon: "/ppa/badges/las-vegas.png" },
  "veolia-chicago-cup": { primary: "#003058", accent: "#c8102e", icon: "/ppa/badges/chicago.png" },
  "virginia-beach-open": { primary: "#003058", accent: "#0078d0", icon: "/ppa/badges/virginia-beach.png" },
  "pickleball-world-championships": { primary: "#182068", accent: "#007838", icon: "/ppa/badges/worlds.png" },
  "proton-daytona-beach-open": { primary: "#003058", accent: "#2088e0", icon: "/ppa/badges/daytona.png" },
  "veolia-malibu-cup": { primary: "#003058", accent: "#e23a76", icon: "/ppa/badges/malibu.png" },
  "veolia-arizona-open": { primary: "#003058", accent: "#0078d0", icon: "/ppa/badges/arizona.png" },
};

// Real commerce deep links per generated slug (verified against the live
// ppatour.com schedule buttons + HTTP-checked, Jul 2026). Anything not listed
// falls back to the group listing / registration home until its page exists.
const COMMERCE_BY_SLUG: Record<string, { tickets?: string; register?: string }> = {
  "veolia-pickleball-national-championships": {
    tickets: tixrEvent("veolia-pickleball-national-championships-184656"),
    register: registerEvent("ppa-tour-veolia-ppa-national-championships"),
  },
  "veolia-arizona-open": { tickets: tixrEvent("ppa-mesa-195027") },
  "rate-las-vegas-open": {
    tickets: tixrEvent("ppa-las-vegas-178513"),
    register: registerEvent("ppa-tour-2026-rate-las-vegas-open"),
  },
  "veolia-chicago-cup": {
    tickets: tixrEvent("ppa-chicago-176687"),
    register: registerEvent("ppa-tour-veolia-chicago-open"),
  },
  "virginia-beach-open": {
    tickets: tixrEvent("ppa-virginia-beach-176326"),
    register: registerEvent("ppa-tour-2026-virginia-beach-open"),
  },
  "pickleball-world-championships": {
    tickets: tixrEvent("2026-world-pickleball-championships-166345"),
    register: registerEvent("2026-pickleball-world-championships"),
  },
  "proton-daytona-beach-open": {
    tickets: tixrEvent("ppa-daytona-beach-178517"),
    register: registerEvent("ppa-tour-florida-open"), // Holly Hill venue — same event
  },
  "veolia-malibu-cup": {
    tickets: tixrEvent("ppa-malibu-176502"),
    register: registerEvent("ppa-tour-veolia-malibu-cup"),
  },
  "carvana-pickleball-masters": {
    register: registerEvent("ppa-tour-carvana-pickleball-masters-powered-by-invited"),
  },
  "macon-ppa-challenger": {
    tickets: tixrEvent("ppa-challenger-series-macon-166226"),
    register: registerEvent("2026-macon-ppa-challenger"),
  },
  "wisconsin-ppa-challenger": {
    tickets: tixrEvent("ppa-challenger-series-wisonsin-166227"), // (sic — Tixr's slug)
    register: registerEvent("2026-wisconsin-ppa-challenger"),
  },
  "seattle-ppa-challenger": {
    tickets: tixrEvent("ppa-challenger-series-seattle-166228"),
    register: registerEvent("2026-seattle-ppa-challenger"),
  },
  "atlanta-ppa-challenger": {
    tickets: tixrEvent("ppa-challenger-series-peachtree-city-173667"),
    register: registerEvent("atlanta-ppa-challenger"),
  },
  "grand-rapids-ppa-challenger": {
    tickets: tixrEvent("ppa-challenger-series-grand-rapids-166229"),
    register: registerEvent("2026-grand-rapids-ppa-challenger"),
  },
  "charlotte-ppa-challenger": { register: registerEvent("charlotte-ppa-challenger") },
  "sarasota-ppa-challenger": {
    tickets: tixrEvent("ppa-challenger-series-sarasota-171536"),
    register: registerEvent("sarasota-ppa-challenger"),
  },
};

// Presenting sponsors that differ from the name-prefix heuristic (per the
// official badge artwork: title sponsor lives in the name, presenter below).
const PRESENTER_BY_SLUG: Record<string, string> = {
  "veolia-pickleball-national-championships": "Fasenra",
  "rate-las-vegas-open": "JOOLA",
  "veolia-chicago-cup": "Storm",
  "veolia-malibu-cup": "Proton",
};

/** Expand the compact schedule into Tournament records with unique slugs. */
function buildSchedule(raws: RawEvent[], seen: Set<string>): Tournament[] {
  return raws.map((r, i) => {
    let slug = kebab(r.name);
    if (seen.has(slug)) slug = `${slug}-${r.start}`;
    seen.add(slug);

    const tier: EventTier =
      r.type === "challenger" ? "challenger" : r.type === "international" ? "open" : r.tier!;
    const sponsor = SPONSORS.find((s) => r.name.startsWith(s));

    return {
      slug,
      name: r.name,
      shortName: r.short,
      city: r.city,
      state: r.state,
      venue: r.venue ?? r.city,
      startDate: r.start,
      endDate: r.end,
      ticketPriceFrom: r.type === "international" ? 35 : TIER_PRICE[tier],
      ticketsUrl: COMMERCE_BY_SLUG[slug]?.tickets ?? TIXR,
      registerUrl: COMMERCE_BY_SLUG[slug]?.register ?? REGISTER,
      status: "upcoming" as const,
      tierKey: tier,
      prizeMoney: r.type === "international" ? "$100,000" : TIER_PRIZE[tier],
      presentedBy: PRESENTER_BY_SLUG[slug] ?? sponsor,
      // Main-tour cards lead with venue scenes; Challengers/international
      // keep action shots (their cards are the smaller treatments).
      image:
        r.image ??
        (r.type === "ppa"
          ? VENUE_IMAGES[i % VENUE_IMAGES.length]
          : GENERIC_IMAGES[i % GENERIC_IMAGES.length]),
      gallery: GALLERY_BY_SLUG[slug],
      brand: BRAND_BY_SLUG[slug],
      region: r.type === "international" ? ("international" as const) : undefined,
      country: r.country,
    };
  });
}

// 2026–27 season, chronological.
const SCHEDULE: RawEvent[] = [
  // July 2026
  { name: "PPA Australia 250 Melbourne", short: "Melbourne", start: "2026-07-15", end: "2026-07-19", city: "Melbourne", state: "Australia", type: "international", country: "Australia" },
  { name: "Macon PPA Challenger", short: "Macon Challenger", start: "2026-07-17", end: "2026-07-19", city: "Macon", state: "GA", type: "challenger" },
  { name: "PPA Italy 125 Portoroz", short: "Portoroz", start: "2026-07-22", end: "2026-07-26", city: "Portoroz", state: "Italy", type: "international", country: "Italy" },
  { name: "PPA Asia 500 Singapore Open", short: "Singapore Open", start: "2026-07-23", end: "2026-07-26", city: "Singapore", state: "", type: "international", country: "Asia" },
  { name: "Wisconsin PPA Challenger", short: "Wisconsin Challenger", start: "2026-07-31", end: "2026-08-02", city: "Lake Hallie", state: "WI", type: "challenger" },

  // August 2026
  { name: "PPA Asia 500 Ho Chi Minh City Open", short: "Ho Chi Minh Open", start: "2026-08-06", end: "2026-08-09", city: "Ho Chi Minh City", state: "Vietnam", type: "international", country: "Asia" },
  { name: "PPA Australia Gold Coast", short: "Gold Coast", start: "2026-08-13", end: "2026-08-16", city: "Gold Coast", state: "Australia", type: "international", country: "Australia" },
  { name: "Seattle PPA Challenger", short: "Seattle Challenger", start: "2026-08-14", end: "2026-08-16", city: "Seattle", state: "WA", type: "challenger" },
  { name: "PPA Canada 250 Vancouver", short: "Vancouver 250", start: "2026-08-19", end: "2026-08-23", city: "Vancouver", state: "Canada", type: "international", country: "Canada" },
  { name: "PPA Asia 500 China Open 2", short: "China Open", start: "2026-08-20", end: "2026-08-23", city: "Shenzhen", state: "China", type: "international", country: "Asia" },
  { name: "Atlanta PPA Challenger", short: "Atlanta Challenger", start: "2026-08-28", end: "2026-08-30", city: "Peachtree City", state: "GA", type: "challenger" },
  { name: "Veolia Pickleball National Championships", short: "National Championships", start: "2026-08-31", end: "2026-09-06", city: "Cary", state: "NC", venue: "Cary Tennis Park", type: "ppa", tier: "slam", image: "/ppa/nationals-drone-champcourt.jpg" },

  // September 2026
  { name: "PPA Asia 1000 Kuala Lumpur Cup", short: "Kuala Lumpur", start: "2026-09-09", end: "2026-09-13", city: "Kuala Lumpur", state: "Malaysia", type: "international", country: "Asia" },
  { name: "PPA Canada 125 Vancouver", short: "Vancouver 125", start: "2026-09-10", end: "2026-09-13", city: "Vancouver", state: "Canada", type: "international", country: "Canada" },
  { name: "Veolia Arizona Open", short: "Arizona Open", start: "2026-09-14", end: "2026-09-20", city: "Mesa", state: "AZ", venue: "Arizona Athletic Grounds", type: "ppa", tier: "open" },
  { name: "Grand Rapids PPA Challenger", short: "Grand Rapids Challenger", start: "2026-09-18", end: "2026-09-20", city: "Rockford", state: "MI", type: "challenger" },
  { name: "PPA Spain P250 Barcelona", short: "Barcelona P250", start: "2026-09-23", end: "2026-09-27", city: "Barcelona", state: "Spain", type: "international", country: "Spain" },
  { name: "Charlotte PPA Challenger", short: "Charlotte Challenger", start: "2026-09-25", end: "2026-09-27", city: "Charlotte", state: "NC", type: "challenger" },
  { name: "Rate Las Vegas Open", short: "Las Vegas Open", start: "2026-09-28", end: "2026-10-04", city: "Las Vegas", state: "NV", venue: "Darling Tennis Center", type: "ppa", tier: "open" },

  // October 2026
  { name: "Veolia Chicago Cup", short: "Chicago Cup", start: "2026-10-05", end: "2026-10-11", city: "Chicago", state: "IL", venue: "Life Time — Northbrook", type: "ppa", tier: "cup" },
  { name: "Sarasota PPA Challenger", short: "Sarasota Challenger", start: "2026-10-09", end: "2026-10-11", city: "Englewood", state: "FL", type: "challenger" },
  { name: "Virginia Beach Open", short: "Virginia Beach Open", start: "2026-10-12", end: "2026-10-18", city: "Virginia Beach", state: "VA", venue: "Virginia Beach Sports Center", type: "ppa", tier: "open" },
  { name: "PPA 1500 Australia Pickleball Open", short: "Australia Open", start: "2026-10-13", end: "2026-10-18", city: "Australia", state: "", type: "international", country: "Australia" },
  { name: "PPA Asia 1500 Hong Kong Slam", short: "Hong Kong", start: "2026-10-19", end: "2026-10-25", city: "Hong Kong", state: "China", type: "international", country: "Asia" },
  { name: "PPA Canada 125 Ottawa", short: "Ottawa", start: "2026-10-22", end: "2026-10-25", city: "Ottawa", state: "Canada", type: "international", country: "Canada" },

  // November 2026
  { name: "Pickleball World Championships", short: "World Championships", start: "2026-11-02", end: "2026-11-08", city: "Farmers Branch", state: "TX", venue: "Brookhaven Country Club", type: "ppa", tier: "worlds" },
  { name: "PPA Spain P125", short: "Spain P125", start: "2026-11-11", end: "2026-11-15", city: "TBA", state: "Spain", type: "international", country: "Spain" },
  { name: "Proton Daytona Beach Open", short: "Daytona Beach Open", start: "2026-11-16", end: "2026-11-22", city: "Holly Hill", state: "FL", venue: "Pictona at Holly Hill", type: "ppa", tier: "open" },
  { name: "PPA Canada 125 Toronto", short: "Toronto 125", start: "2026-11-26", end: "2026-11-29", city: "Toronto", state: "Canada", type: "international", country: "Canada" },
  { name: "Veolia Malibu Cup", short: "Malibu Cup", start: "2026-11-30", end: "2026-12-06", city: "Malibu", state: "CA", venue: "Pepperdine University", type: "ppa", tier: "cup" },

  // December 2026
  { name: "PPA Australia 125 New South Wales", short: "New South Wales", start: "2026-12-11", end: "2026-12-13", city: "New South Wales", state: "Australia", type: "international", country: "Australia" },

  // January 2027
  { name: "PPA Italy 125 Brescia", short: "Brescia", start: "2027-01-05", end: "2027-01-09", city: "Brescia", state: "Italy", type: "international", country: "Italy" },
  { name: "Carvana Pickleball Masters", short: "Pickleball Masters", start: "2027-01-11", end: "2027-01-17", city: "Rancho Mirage", state: "CA", venue: "Hyatt Regency Indian Wells", type: "ppa", tier: "slam" },
  { name: "Minneapolis Indoor Open", short: "Minneapolis Open", start: "2027-01-18", end: "2027-01-24", city: "Lakeville", state: "MN", venue: "Life Time — Lakeville", type: "ppa", tier: "open" },
  { name: "PPA Spain P125", short: "Spain P125", start: "2027-01-27", end: "2027-01-31", city: "TBA", state: "Spain", type: "international", country: "Spain" },

  // February 2027
  { name: "Cape Coral Open", short: "Cape Coral Open", start: "2027-02-01", end: "2027-02-07", city: "Cape Coral", state: "FL", venue: "Cape Coral Racquet Club", type: "ppa", tier: "open" },
  { name: "Carvana Mesa Cup", short: "Mesa Cup", start: "2027-02-15", end: "2027-02-21", city: "Mesa", state: "AZ", venue: "Bell Bank Park", type: "ppa", tier: "cup" },
  { name: "PPA Australia 125 Melbourne", short: "Melbourne 125", start: "2027-02-18", end: "2027-02-21", city: "Melbourne", state: "Australia", type: "international", country: "Australia" },
  { name: "PPA Spain P250", short: "Spain P250", start: "2027-02-24", end: "2027-02-28", city: "TBA", state: "Spain", type: "international", country: "Spain" },

  // March 2027
  { name: "Newport Beach Open", short: "Newport Beach Open", start: "2027-03-02", end: "2027-03-07", city: "Newport Beach", state: "CA", venue: "Tennis Club at Newport Beach", type: "ppa", tier: "open" },
  { name: "Texas Open", short: "Texas Open", start: "2027-03-08", end: "2027-03-14", city: "Dallas", state: "TX", venue: "The Courts of McKinney", type: "ppa", tier: "open" },
  { name: "PPA Australia 250 Sydney Finals", short: "Sydney Finals", start: "2027-03-17", end: "2027-03-21", city: "Sydney", state: "Australia", type: "international", country: "Australia" },
  { name: "PPA Spain P500", short: "Spain P500", start: "2027-03-17", end: "2027-03-21", city: "TBA", state: "Spain", type: "international", country: "Spain" },
  { name: "Greater Zion Cup at Black Desert Resort", short: "Greater Zion Cup", start: "2027-03-22", end: "2027-03-28", city: "St. George", state: "UT", venue: "Black Desert Resort", type: "ppa", tier: "cup" },

  // April 2027
  { name: "PPA Open", short: "PPA Open", start: "2027-04-05", end: "2027-04-11", city: "TBD", state: "", type: "ppa", tier: "open" },
  { name: "Sacramento Open", short: "Sacramento Open", start: "2027-04-05", end: "2027-04-11", city: "Sacramento", state: "CA", venue: "Life Time — Arden", type: "ppa", tier: "open" },
  { name: "Cincinnati Open", short: "Cincinnati Open", start: "2027-04-12", end: "2027-04-18", city: "Cincinnati", state: "OH", venue: "Lindner Family Tennis Center", type: "ppa", tier: "open" },
  { name: "PPA Spain P250", short: "Spain P250", start: "2027-04-21", end: "2027-04-25", city: "TBA", state: "Spain", type: "international", country: "Spain" },
  { name: "Atlanta Pickleball Championships", short: "Atlanta Championships", start: "2027-04-26", end: "2027-05-02", city: "Atlanta", state: "GA", venue: "Life Time — Peachtree Corners", type: "ppa", tier: "slam" },

  // May 2027
  { name: "PPA Spain P500 Barcelona", short: "Barcelona P500", start: "2027-05-05", end: "2027-05-09", city: "Barcelona", state: "Spain", type: "international", country: "Spain" },
  { name: "PPA Finals", short: "PPA Finals", start: "2027-05-10", end: "2027-05-16", city: "San Clemente", state: "CA", venue: "Life Time — Rancho San Clemente", type: "ppa", tier: "slam" },
];

// Recent completed events — power the /events Past tab + Season filter.
const PAST_EVENTS: Tournament[] = [
  {
    slug: "2026-carvana-utah-open",
    name: "Carvana Utah Open",
    shortName: "Utah Open",
    city: "Salt Lake City",
    state: "UT",
    venue: "Liberty Park Courts",
    startDate: "2026-03-30",
    endDate: "2026-04-05",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "completed",
    tierKey: "open",
    prizeMoney: "$150,000",
    presentedBy: "Carvana",
    image: "/ppa/action-singles.jpg",
    season: "2025-2026",
  },
  {
    slug: "2026-veolia-kansas-city-cup",
    name: "Veolia Kansas City Cup",
    shortName: "Kansas City Cup",
    city: "Overland Park",
    state: "KS",
    venue: "Chicken N Pickle — Overland Park",
    startDate: "2026-04-27",
    endDate: "2026-05-03",
    ticketPriceFrom: 49,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "completed",
    tierKey: "cup",
    prizeMoney: "$1,271,734",
    presentedBy: "Veolia",
    image: "/ppa/action-mxd.jpg",
    season: "2025-2026",
  },
  {
    slug: "2026-orlando-open",
    name: "Orlando Open",
    shortName: "Orlando Open",
    city: "Orlando",
    state: "FL",
    venue: "USTA National Campus",
    startDate: "2026-05-18",
    endDate: "2026-05-24",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "completed",
    tierKey: "open",
    prizeMoney: "$150,000",
    image: "/ppa/action-md-final.jpg",
    season: "2025-2026",
  },
  {
    slug: "2026-los-angeles-slam",
    name: "Los Angeles Slam",
    shortName: "LA Slam",
    city: "Los Angeles",
    state: "CA",
    venue: "Dignity Health Sports Park",
    startDate: "2026-06-08",
    endDate: "2026-06-14",
    ticketPriceFrom: 59,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "completed",
    tierKey: "slam",
    prizeMoney: "$300,000",
    image: "/ppa/action-champ-sunday.jpg",
    season: "2025-2026",
  },
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
    registerUrl: REGISTER,
    status: "completed",
    tierKey: "challenger",
    prizeMoney: "$25,000",
    image: "/ppa/action-mxd.jpg",
    season: "2025-2026",
  },
  {
    slug: "2025-newport-beach-open",
    name: "Newport Beach Open",
    shortName: "Newport Open",
    city: "Newport Beach",
    state: "CA",
    venue: "Tennis Club at Newport Beach",
    startDate: "2025-09-10",
    endDate: "2025-09-16",
    ticketPriceFrom: 39,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "completed",
    tierKey: "open",
    prizeMoney: "$1,063,327",
    image: "/ppa/action-waters-bright.jpg",
    season: "2025",
  },
  {
    slug: "2024-dallas-slam",
    name: "Dallas Open",
    shortName: "Dallas Open",
    city: "Dallas",
    state: "TX",
    venue: "Brookhaven Country Club",
    startDate: "2024-10-14",
    endDate: "2024-10-20",
    ticketPriceFrom: 55,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "completed",
    tierKey: "slam",
    prizeMoney: "$300,000",
    image: "/ppa/action-md-final.jpg",
    season: "2024",
  },
  {
    slug: "2023-phoenix-cup",
    name: "Phoenix Cup",
    shortName: "Phoenix Cup",
    city: "Phoenix",
    state: "AZ",
    venue: "Bell Bank Park",
    startDate: "2023-11-06",
    endDate: "2023-11-12",
    ticketPriceFrom: 45,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "completed",
    tierKey: "cup",
    prizeMoney: "$200,000",
    image: "/ppa/action-mxd.jpg",
    season: "2023",
  },
  {
    slug: "2022-miami-open",
    name: "Miami Open",
    shortName: "Miami Open",
    city: "Miami",
    state: "FL",
    venue: "Miami Beach Tennis Center",
    startDate: "2022-12-05",
    endDate: "2022-12-11",
    ticketPriceFrom: 35,
    ticketsUrl: TIXR,
    registerUrl: REGISTER,
    status: "completed",
    tierKey: "open",
    prizeMoney: "$125,000",
    image: "/ppa/action-singles.jpg",
    season: "2022",
  },
];

export const tournaments: Tournament[] = [
  ...buildSchedule(SCHEDULE, new Set(PAST_EVENTS.map((e) => e.slug))),
  ...PAST_EVENTS,
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
 * Main-tour events only (1,000+ points, domestic, upcoming), chronological.
 * The single source of truth for the homepage — Challengers, international,
 * and completed events never appear.
 */
export function getMainTourEvents(): Tournament[] {
  return tournaments
    .filter(
      (t) =>
        tierPoints(t) >= MAIN_TOUR_MIN_POINTS &&
        t.status !== "completed" &&
        t.region !== "international",
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Every event — all tiers, domestic + international, past + upcoming — chronological. */
export function getAllEvents(): Tournament[] {
  return [...tournaments].sort((a, b) => a.startDate.localeCompare(b.startDate));
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

/**
 * Demo LIVE ticker state for the `/live` preview — shows how the site chrome
 * looks during an active tournament. Replace with real scoring-API data once
 * that lands (see getTickerState). Not used on the real homepage.
 */
export function getLiveTickerState(): TickerState {
  return {
    mode: "LIVE",
    court: "Championship Court",
    players: ["Ben Johns", "Federico Staksrud"],
    score: "11–9, 9–11, 8–6",
    watchUrl: "/watch",
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

/**
 * "May 26–31" or "May 28 – Jun 2". With `withYear`, appends the year — and the
 * start year too when the range crosses a year boundary ("Dec 30, 2026 – Jan 2, 2027").
 */
export function formatDateRange(startIso: string, endIso: string, withYear = false): string {
  const [sy, sm] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  if (!withYear) {
    if (sm === em) return `${formatDate(startIso)}–${ed}`;
    return `${formatDate(startIso)} – ${formatDate(endIso)}`;
  }
  if (sy !== ey) return `${formatDate(startIso)}, ${sy} – ${formatDate(endIso)}, ${ey}`;
  if (sm === em) return `${formatDate(startIso)}–${ed}, ${ey}`;
  return `${formatDate(startIso)} – ${formatDate(endIso)}, ${ey}`;
}

/** Whole days from now until the given ISO date (floored at 0). */
export function daysUntil(iso: string): number {
  const target = new Date(`${iso}T00:00:00`).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / 86_400_000));
}
