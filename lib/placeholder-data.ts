/**
 * Tournament data — the PPA Tour 2026–27 season (main tour, Challengers, and
 * international stops) plus recent completed events for the /events Past tab.
 *
 * Tiers follow the real PPA points structure:
 *   Worlds 3,000 · Championship 2,000 · Cup 1,500 · Open 1,000 · Challenger 125–500.
 *
 * "Majors" are a separate, curated designation layered on top of the points
 * tier (Connor, 7/23): the four crown-jewel stops — Masters, the Players
 * (Atlanta), Nationals, and Worlds — carry a MAJOR badge regardless of tier.
 * See {@link isMajor}. (PPA Finals is 2,000-pt but NOT a major.)
 *
 * `getMainTourEvents()` keeps Challengers + international off the homepage.
 * Upcoming events use generic action photos as placeholders — replace with the
 * live calendar + real event art via the CMS / API.
 */

import { asiaTourUrlForCuratedSlug } from "@/lib/asia-tour-links";
import { venueGalleryFor, venueHeroFor } from "@/lib/venue-photos";
import { ticketPriceFrom, ticketsOnSale } from "@/lib/tixr-price-index";

export type EventTier = "worlds" | "slam" | "cup" | "open" | "challenger";

export const TIER_META: Record<
  EventTier,
  { label: string; short: string; points: number }
> = {
  worlds: { label: "World Championship", short: "Worlds", points: 3000 },
  slam: { label: "PPA Tour Championship", short: "Championship", points: 2000 },
  cup: { label: "PPA Tour Cup", short: "Cup", points: 1500 },
  open: { label: "PPA Tour Open", short: "Open", points: 1000 },
  challenger: { label: "PPA Challenger", short: "Challenger", points: 500 },
};

/**
 * The points number stated in an event name, when present. International stops
 * carry their level in the title — "PPA Asia 1500 Hong Kong", "PPA Spain P250
 * Barcelona", "PPA Canada 125 Ottawa" — so we can rank them honestly (only
 * 1,000+ belong on The Tour) and filter the sub-1,000 stops apart from each
 * other in Find an Event. Returns null when there's no recognizable token.
 *
 * The token is not always space-separated — the Australia feed sends
 * "PPA125 - GOLD COAST" and "PPA1500 - AUSTRALIA PICKLEBALL CUP" glued to the
 * org prefix, which `\b` alone never matched. That's why a 125-point Gold Coast
 * stop was being sold as a 1,000-point tour event (Connor, 7/29).
 */
import { eventCode } from "@/lib/event-code";

export function pointsFromName(name: string): number | null {
  const m = name.match(/(?:\b|PPA)P?(3000|2000|1500|1000|500|250|125)\b/i);
  return m ? Number(m[1]) : null;
}

/** Tier from that same token. Null when the name doesn't state one. */
export function tierFromName(name: string): EventTier | null {
  const pts = pointsFromName(name);
  if (pts === null) return null;
  if (pts >= 3000) return "worlds";
  if (pts >= 2000) return "slam";
  if (pts >= 1500) return "cup";
  if (pts >= 1000) return "open";
  return "challenger";
}

/** Minimum ranking points for an event to appear on the homepage + schedule. */
export const MAIN_TOUR_MIN_POINTS = 1000;

export type Tournament = {
  slug: string;
  /**
   * The event's FULL name, title sponsor included — "Veolia Pickleball National
   * Championships", never "National Championships".
   *
   * ⚠ There is deliberately no `shortName`. It used to exist and it was rendered
   * in 54 places, which meant the site stripped the title sponsor off the `<h1>`,
   * the `<title>` and the OG share card of the events those sponsors pay to
   * title — 8 of the 12 abbreviations existed for no other reason. Jeff Watson,
   * 8/3: "we need to call every tournament by their full name — in every
   * instance." Don't reintroduce it; abbreviate at the call site if a specific
   * piece of chrome genuinely can't fit.
   */
  name: string;
  city: string;
  state: string;
  venue: string;
  /** ISO date (yyyy-mm-dd) */
  startDate: string;
  endDate: string;
  ticketPriceFrom: number;
  /**
   * Resolved server-side from the Tixr snapshot. Lives on the record rather than
   * being computed in components because ScheduleGrid is a client component and
   * importing lib/tixr-prices there would ship the whole 193KB price snapshot to
   * the browser.
   */
  ticketsOnSale?: boolean;
  ticketsUrl: string;
  registerUrl: string;
  status: "upcoming" | "live" | "completed";
  /**
   * Canonical `MMYY-PPA-CITY-ST-USA` code — the join key Jackalope parses out
   * of `utm_campaign` to attribute marketing to this event. Derived, never
   * hand-set; see lib/event-code.ts.
   */
  eventCode: string | null;
  tierKey: EventTier;
  /** Exact ranking points when the event name states them. Only set on
      sub-1,000 stops, where the flat `challenger` tier would otherwise sell a
      125 as a 500 — the Find an Event tier filter needs the real number. */
  points?: number;
  prizeMoney: string;
  presentedBy?: string;
  image: string;
  /** Real defending champions by division (last year's winners at THIS event).
      Per-event — only set where confirmed; the page shows an honest
      "to be confirmed" state otherwise, never the same placeholder names on
      every event (Connor, 7/23: "make sure it's right"). */
  defendingChampions?: { division: string; name: string }[];
  /** Optional real-photo gallery (paths under /public). */
  gallery?: string[];
  /** Per-event brand system (colors + optional icon) used on the event page. */
  brand?: {
    primary: string;
    accent: string;
    icon?: string;
    /** Opt-in display serif for the event page (echoes the event's wordmark). */
    font?: "cormorant";
  };
  /** International-tour events (for the /events category filter). Domestic if unset. */
  region?: "international";
  /** Region for international events (matches the Country filter). Connor,
      7/31: the list is USA / Asia / Australia / Europe / Canada — Italy and
      Spain roll up into Europe rather than sitting as their own entries. */
  country?: "Asia" | "Australia" | "Canada" | "Europe";
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
  /**
   * Announced, but nothing to send anyone to yet: the card renders on /events
   * with "Details Coming Soon" and is NOT a link — no internal page, no
   * link-out. Wesley, 8/13, adding the Texas Open before its venue is set.
   *
   * ⚠ THIS IS A THIRD STATE, NOT A FLAVOUR OF `hasInternalPage: false`. A
   * link-out event has somewhere to go (the sister tour that runs it) and is
   * rendered as an `<a target="_blank">` with a "↗". This one has nowhere, and
   * the two must not be confused: `hasInternalPage: false` with no URL
   * silently produces `<a href={undefined}>`, i.e. a card that looks clickable
   * and does nothing. Every link surface checks this flag FIRST.
   *
   * ⚠ AND IT IS WHAT PUTS THE EVENT ON /events AT ALL. That page renders the
   * live feed, so a curated stop the feed has never heard of does not appear
   * (the 8/6 Hong Kong note). `getEvents` merges the flagged ones back in.
   *
   * Clearing the flag is the whole of "give it a real page": the event then
   * takes the normal curated path, links to /events/[year]/[slug] and joins
   * the search index.
   */
  detailsComingSoon?: boolean;
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

/**
 * ⚠ VENUE_IMAGES are Melbourne / Macao / Gold Coast city shots. Cycling them
 * across the U.S. calendar is how the Las Vegas Open ended up illustrated with
 * the Brisbane skyline and the World Championships with the Macau tower
 * (Bryce, 7/28). They are now used ONLY for the international stops they
 * actually depict; domestic events fall back to real PPA action photography
 * until their venue is synced from Jackalope (see lib/venue-photos.ts and
 * scripts/sync-venue-photos.mjs).
 */
export const DOMESTIC_FALLBACK_IMAGES = GENERIC_IMAGES;

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

/**
 * The Gold Prize Grid — the on-court prize money paid out per event by finish,
 * across the five pro divisions (distinct from the prize+fees headline in
 * TIER_PRIZE). Real 2026 grid totals from ppatour.com/how-it-works
 * (Bryce, 7/15). PPA Finals runs its own $628k grid — see GOLD_GRID_BY_SLUG.
 *
 * ⚠ NOTHING RENDERS THIS TODAY. The GoldPrizeGrid component that displayed it
 * on the event page and the -live route was removed 8/4 (Bryce). The data is
 * kept because the totals are real and verified; if the grid comes back, it
 * reads from here. The purse a fan sees now is TIER_PRIZE (prize + appearance
 * fees) in the hero, quick facts and What's at Stake.
 */
export const GOLD_GRID: Record<EventTier, string> = {
  worlds: "$1,024,400",
  slam: "$1,024,400",
  cup: "$647,493",
  open: "$439,086",
  challenger: "$25,000",
};
const GOLD_GRID_BY_SLUG: Record<string, string> = {
  "ppa-finals": "$628,000",
};

/** The event's Gold Prize Grid total (slug override wins, else the tier grid). */
export function goldGridTotal(t: Pick<Tournament, "slug" | "tierKey">): string {
  return GOLD_GRID_BY_SLUG[t.slug] ?? GOLD_GRID[t.tierKey];
}

export function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The 4-digit year an event belongs to (from its start date). */
export function eventYear(t: Pick<Tournament, "startDate">): string {
  return t.startDate.slice(0, 4);
}

/** Canonical internal path for an event: /events/{year}/{slug}. */
export function eventHref(t: Pick<Tournament, "startDate" | "slug">): string {
  return `/events/${t.startDate.slice(0, 4)}/${t.slug}`;
}

type RawEvent = {
  name: string;
  /**
   * Explicit slug, ONLY for events whose display name would otherwise repoint
   * their URL. The slug is normally `kebab(name)`, which means renaming an event
   * silently moves its page and orphans every key that hangs off the slug —
   * BRAND_BY_SLUG, COMMERCE_BY_SLUG, GALLERY_BY_SLUG, event-guides, broadcast,
   * venue-photos, MAJOR_SLUGS, the sitemap and any inbound link. Set this to the
   * ORIGINAL slug when you change a name. See the three feed-aligned names below.
   */
  slug?: string;
  start: string;
  end: string;
  city: string;
  state: string;
  venue?: string;
  type: "ppa" | "challenger" | "international";
  tier?: EventTier;
  /**
   * Exact ranking points, hand-set. Only needed on Challengers: the
   * international stops state their level in the title ("PPA Canada 125
   * Ottawa") so `pointsFromName` reads it, but a U.S. Challenger is just
   * "Seattle PPA Challenger" — no number anywhere — so it used to fall
   * through to the flat `challenger` tier default and publish 500.
   *
   * ⚠ Events team, 8/5: 250 is the CEILING for the Challenger series; the
   * 500 the site was showing is a number the tour does not award. The four
   * stops they confirmed carry it below. The rest still read the 500
   * default — set this on each one as its real level is confirmed.
   */
  points?: number;
  country?: Tournament["country"];
  image?: string;
  /** See {@link Tournament.detailsComingSoon}. */
  detailsComingSoon?: boolean;
};

// Badge-matched brand colors + icons per event (keyed by generated slug).
const BRAND_BY_SLUG: Record<
  string,
  { primary: string; accent: string; icon?: string; font?: "cormorant" }
> = {
  /**
   * ⚠ NATIONALS NO LONGER OPTS INTO THE DISPLAY SERIF (Wesley, 8/4: the Events
   * "heading font [is] not matching the rest of the site"). It was the only
   * event that did, added 7/20 off the Nationals brand guide, and it swapped the
   * face on the H1 AND every section H2 — so measured at 1440px the whole page
   * rendered Cormorant 700 while all 19 other event pages and every other page
   * on the site rendered Gotham 900. That is what read as inconsistent.
   *
   * The mechanism is intact, not deleted: `font` below and `.event-display` in
   * globals.css still work, and with nothing opting in `.event-display` is
   * byte-for-byte `.font-display`. Don't set `font` again without a ruling —
   * turning it on for one event is what caused this.
   */
  "veolia-pickleball-national-championships": { primary: "#023155", accent: "#C1272D", icon: "/ppa/badges/nationals.png" },
  "rate-las-vegas-open": { primary: "#003058", accent: "#2088e0", icon: "/ppa/badges/las-vegas.png" },
  "veolia-chicago-cup": { primary: "#003058", accent: "#c8102e", icon: "/ppa/badges/chicago.png" },
  "virginia-beach-open": { primary: "#003058", accent: "#0078d0", icon: "/ppa/badges/virginia-beach.png" },
  "pickleball-world-championships": { primary: "#182068", accent: "#007838", icon: "/ppa/badges/worlds.png" },
  "proton-daytona-beach-open": { primary: "#003058", accent: "#2088e0", icon: "/ppa/badges/daytona.png" },
  "veolia-malibu-cup": { primary: "#003058", accent: "#e23a76", icon: "/ppa/badges/malibu.png" },
  "veolia-arizona-open": { primary: "#003058", accent: "#0078d0", icon: "/ppa/badges/arizona.png" },
  "cape-coral-open": { primary: "#0a2540", accent: "#12a5a5", icon: "/ppa/badges/cape-coral.png" },
  "greater-zion-cup-at-black-desert-resort": { primary: "#0e2a47", accent: "#c0451f", icon: "/ppa/badges/greater-zion.png" },
  "carvana-mesa-cup": { primary: "#5b2d82", accent: "#7b4bab", icon: "/ppa/badges/mesa-cup.png" },
  "minneapolis-indoor-open": { primary: "#0a2540", accent: "#2088e0", icon: "/ppa/badges/minneapolis.png" },
  "newport-beach-open": { primary: "#0a7bc2", accent: "#0a7bc2", icon: "/ppa/badges/newport-beach.png" },
  "carvana-pickleball-masters": { primary: "#1a7a3c", accent: "#1a7a3c", icon: "/ppa/badges/masters.png" },
  /**
   * ⚠ THE ONLY ENTRY HERE WHOSE ARTWORK COMES FROM THE API, NOT FROM OUR BADGE
   * SET (Wesley, 8/7). The event team updated the Finals logo upstream on
   * 2026-08-06 and the site kept showing the old crest, because nothing here
   * reads the feed — this table is the sole source of every event mark. The
   * file is the `logo_url` on the feed's "PPA Tour: 2027 PPA Finals" row,
   * trimmed of the flat white margin the CMS bakes in:
   *   cdn.pickleballbrackets.com/uploads/Clubs/80f17003-…/943158d1-…_Logo.png
   *
   * ⚠ IT IS A LOCAL COPY ON PURPOSE, NOT THE URL. Pointing `icon` at the CDN
   * would strip the mark off the event's OG share card — `ogImageData` in
   * lib/og.ts reads from the filesystem and returns null for anything else —
   * and it would not self-update regardless: the filename carries a timestamp,
   * so the next upstream change mints a different URL rather than replacing
   * this one. Re-run the same trim against the row's current `logo_url` when
   * the artwork changes again.
   */
  "ppa-finals": { primary: "#0c2b44", accent: "#c9a227", icon: "/ppa/badges/ppa-finals.png" },
  "sacramento-open": { primary: "#0a2540", accent: "#2088e0", icon: "/ppa/badges/sacramento.png" },
  "texas-open": { primary: "#0a2540", accent: "#2088e0", icon: "/ppa/badges/texas.png" },
  // Temporary: the Players Championships (Atlanta) has no portrait badge card yet,
  // so the primary logo is set on a white card to match the badge set (Tyler, 8/4).
  "atlanta-pickleball-championships": { primary: "#0a2540", accent: "#e8825a", icon: "/ppa/badges/players-championships.png" },
};

/** Brand (colors + badge icon) for a generated slug, or undefined. Exposed so the
 *  feed adapter can attach a badge even when the curated record it matched has
 *  none of its own — e.g. a past-season duplicate that won the slug collision
 *  (2025 Newport Beach Open vs the 2027 upcoming stop). */
export function brandForSlug(slug: string) {
  return BRAND_BY_SLUG[slug];
}

// Real commerce deep links per generated slug (verified against the live
// ppatour.com schedule buttons + HTTP-checked, Jul 2026). Anything not listed
// falls back to the group listing / registration home until its page exists.
const COMMERCE_BY_SLUG: Record<string, { tickets?: string; register?: string }> = {
  "veolia-pickleball-national-championships": {
    tickets: tixrEvent("veolia-pickleball-national-championships-184656"),
    register: registerEvent("ppa-tour-veolia-ppa-national-championships"),
  },
  "veolia-arizona-open": { tickets: tixrEvent("ppa-mesa-195027") },
  // Both matched to their Tixr listing on exact city + start date; each was
  // pointing at the generic tixr.com/groups/ppa page before.
  "cape-coral-open": { tickets: tixrEvent("ppa-cape-coral-196548") },
  "cincinnati-open": { tickets: tixrEvent("veolia-ppa-cincinnati-181370") },
  "rate-las-vegas-open": {
    // 178513 is no longer in the PPA group's 61 Tixr events; 195857 is the
    // current "PPA Las Vegas" listing and matches our stop on city and start
    // date (Sep 28 2026). The old id sat behind a live Buy Tickets button.
    tickets: tixrEvent("ppa-las-vegas-195857"),
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
/**
 * Presenting partners, by slug. THE ONLY SOURCE of "Presented by" on the site —
 * an event not listed here has no presenting partner and must not display one.
 *
 * ⚠ This used to fall back to `SPONSORS.find(s => name.startsWith(s))`, which
 * quietly presented an event's own TITLE sponsor as its PRESENTING partner —
 * two different deals sold at two different prices. It fabricated six of the
 * ten presenters on the site, including "Proton Daytona Beach Open presented by
 * Proton" and "Carvana Mesa Cup presented by Carvana". Bryan Renahan flagged
 * three of them on 8/4 ("Veolia Arizona Open is presented by AT Sports, not
 * Veolia. Veolia is title, AT Sports is presenting" · Masters and Mesa Cup
 * "does not have a presenting partner, only Carvana as title"). Don't
 * reintroduce the fallback — an unlisted event showing nothing is correct.
 *
 * ⚠ THE ARIZONA OPEN NO LONGER LISTS A PRESENTING PARTNER (Wesley, 8/20: remove
 * "AT Sports" from Presenting Partner on the AZ Open page). That SUPERSEDES the
 * 8/4 quote above, which is left in place as the record of why the entry existed
 * — read on its own it argues for putting the line back. It does not: the stop
 * now shows no presenting partner, and Veolia remains its title sponsor.
 *
 * AT Sports is untouched as a PARTNER — it keeps its roster entry and its mark
 * in `partners` (lib/home-content.ts, billed there as "AT Sports Surfaces /
 * Acrytech"), and still appears in the sponsor wall on this and every event
 * page. Only the "Presented by" credit on this one stop is gone.
 */
const PRESENTER_BY_SLUG: Record<string, string> = {
  "veolia-pickleball-national-championships": "Fasenra",
  "rate-las-vegas-open": "JOOLA",
  "veolia-chicago-cup": "Storm",
  "veolia-malibu-cup": "Proton",
};

/** Expand the compact schedule into Tournament records with unique slugs. */
function buildSchedule(raws: RawEvent[], seen: Set<string>): Tournament[] {
  return raws.map((r, i) => {
    let slug = r.slug ?? kebab(r.name);
    if (seen.has(slug)) slug = `${slug}-${r.start}`;
    seen.add(slug);

    const tier: EventTier =
      r.type === "challenger"
        ? "challenger"
        : r.type === "international"
          ? // International stops carry their level in the title (1500 / P250 /
            // 125) — rank by that so only the true 1,000+ stops reach The Tour.
            (tierFromName(r.name) ?? "open")
          : r.tier!;

    return {
      slug,
      name: r.name,
      city: r.city,
      state: r.state,
      venue: r.venue ?? r.city,
      startDate: r.start,
      endDate: r.end,
      // Real Tixr price when we have it; the tier table is only a fallback for
      // stops with no Tixr listing yet. See lib/tixr-prices.ts.
      ticketPriceFrom:
        ticketPriceFrom(COMMERCE_BY_SLUG[slug]?.tickets) ??
        (r.type === "international" ? 35 : TIER_PRICE[tier]),
      ticketsOnSale: ticketsOnSale(COMMERCE_BY_SLUG[slug]?.tickets),
      ticketsUrl: COMMERCE_BY_SLUG[slug]?.tickets ?? TIXR,
      registerUrl: COMMERCE_BY_SLUG[slug]?.register ?? REGISTER,
      status: "upcoming" as const,
      eventCode: eventCode({ city: r.city, state: r.state, endDate: r.end }),
      tierKey: tier,
      // Sub-1,000 stops keep their real level (125 / 250 / 500) — the flat
      // Challenger tier reads 500 for all of them otherwise. A hand-set
      // `points` wins over the name parse: U.S. Challengers state no number
      // in their title, so the parse can never answer for them.
      points:
        tier === "challenger" ? (r.points ?? pointsFromName(r.name) ?? undefined) : undefined,
      prizeMoney: r.type === "international" ? "$100,000" : TIER_PRIZE[tier],
      presentedBy: PRESENTER_BY_SLUG[slug],
      // Main-tour cards lead with venue scenes; Challengers/international
      // keep action shots (their cards are the smaller treatments).
      // The event's OWN venue photography wins (synced from Jackalope), then a
      // curated override, then honest generic action. A U.S. stop never
      // borrows another city's skyline.
      image:
        venueHeroFor(slug) ??
        r.image ??
        (r.type === "international"
          ? VENUE_IMAGES[i % VENUE_IMAGES.length]
          : GENERIC_IMAGES[i % GENERIC_IMAGES.length]),
      // Synced venue gallery wins; the hand-curated Nationals set is the
      // fallback until Cary re-syncs.
      gallery: venueGalleryFor(slug).length ? venueGalleryFor(slug) : GALLERY_BY_SLUG[slug],
      brand: BRAND_BY_SLUG[slug],
      region: r.type === "international" ? ("international" as const) : undefined,
      country: r.country,
      // The PPA Tour Asia stops link to the Asia tour's own event page (Wade,
      // 8/6). This is the fallback path — when the API is unreachable these
      // cards would otherwise fall through to `registerUrl`, which for an
      // unlisted stop is the bare pickleballtournaments.com homepage. Undefined
      // for every non-Asia event, which leaves that behaviour exactly as it was.
      externalUrl: asiaTourUrlForCuratedSlug(slug),
      // Only U.S. PPA stops get a rich internal page; Challengers and the
      // international sister tours link out. Stated EXPLICITLY (not left
      // undefined) because the card components treat `!== false` as internal —
      // when the events API is unreachable and we serve this curated list,
      // undefined sent ~28 cards to /events/{year}/{slug} 404s.
      // ⚠ A "details coming soon" stop has NO page, whatever its type. Without
      // this it would be `hasInternalPage: true` (it is a `ppa` row) and every
      // card would link to a route that must not exist yet.
      hasInternalPage: r.type === "ppa" && !r.detailsComingSoon,
      detailsComingSoon: r.detailsComingSoon,
    };
  });
}

// 2026–27 season, chronological.
const SCHEDULE: RawEvent[] = [
  // July 2026
  { name: "PPA Australia 250 Melbourne", start: "2026-07-15", end: "2026-07-19", city: "Melbourne", state: "Australia", type: "international", country: "Australia" },
  { name: "Macon PPA Challenger", start: "2026-07-17", end: "2026-07-19", city: "Macon", state: "GA", type: "challenger" },
  { name: "PPA Italy 125 Portoroz", start: "2026-07-22", end: "2026-07-26", city: "Portoroz", state: "Italy", type: "international", country: "Europe" },
  { name: "PPA Asia 500 Singapore Open", start: "2026-07-23", end: "2026-07-26", city: "Singapore", state: "", type: "international", country: "Asia" },
  { name: "Wisconsin PPA Challenger", start: "2026-07-31", end: "2026-08-02", city: "Lake Hallie", state: "WI", type: "challenger" },

  // August 2026
  { name: "PPA Asia 500 Ho Chi Minh City Open", start: "2026-08-06", end: "2026-08-09", city: "Ho Chi Minh City", state: "Vietnam", type: "international", country: "Asia" },
  { name: "PPA Australia Gold Coast", start: "2026-08-13", end: "2026-08-16", city: "Gold Coast", state: "Australia", type: "international", country: "Australia" },
  { name: "Seattle PPA Challenger", start: "2026-08-14", end: "2026-08-16", city: "Seattle", state: "WA", type: "challenger", points: 250 },
  { name: "PPA Canada 250 Vancouver", start: "2026-08-19", end: "2026-08-23", city: "Vancouver", state: "Canada", type: "international", country: "Canada" },
  { name: "PPA Asia 500 China Open 2", start: "2026-08-20", end: "2026-08-23", city: "Shenzhen", state: "China", type: "international", country: "Asia" },
  { name: "Atlanta PPA Challenger", start: "2026-08-28", end: "2026-08-30", city: "Peachtree City", state: "GA", type: "challenger", points: 125 },
  // ⚠ Name mirrors the ppa_tournaments feed, slug is pinned to the original.
  // Wesley, 8/3: names come from the API. The feed registers this as "Veolia PPA
  // National Championships", not "…Pickleball…". Slug pinned so the URL, brand,
  // guide, broadcast, gallery and MAJOR_SLUGS keys all still resolve.
  { name: "Veolia Pickleball National Championships", slug: "veolia-pickleball-national-championships", start: "2026-08-31", end: "2026-09-06", city: "Cary", state: "NC", venue: "Cary Tennis Park", type: "ppa", tier: "slam", image: "/ppa/nationals-drone-champcourt.jpg" },

  // September 2026
  { name: "PPA Asia 1000 Kuala Lumpur Cup", start: "2026-09-09", end: "2026-09-13", city: "Kuala Lumpur", state: "Malaysia", type: "international", country: "Asia" },
  { name: "PPA Canada 125 Vancouver", start: "2026-09-10", end: "2026-09-13", city: "Vancouver", state: "Canada", type: "international", country: "Canada" },
  { name: "Veolia Arizona Open", start: "2026-09-14", end: "2026-09-20", city: "Mesa", state: "AZ", venue: "Arizona Athletic Grounds", type: "ppa", tier: "open" },
  { name: "Grand Rapids PPA Challenger", start: "2026-09-18", end: "2026-09-20", city: "Rockford", state: "MI", type: "challenger", points: 250 },
  // ⚠ PPA SPAIN PUBLISHES BARCELONA ONLY. Wesley, 8/5, on the PPA Europe
  // announcement: "we should probably remove the dates (aside from Barcelona) as
  // event dates and locations are subject to change." The 5/27 release listed
  // seven Spanish stops with dates but a location for only two, and the other
  // five rows were hand-typed off that table — a date and a `city: "TBA"` for
  // events nobody has committed to a week or a venue for. All five are DELETED,
  // not blanked, so there is no half-filled row for a future edit to complete
  // from the release. The release's own table was updated to match (the five
  // dates now read TBA there too — see scripts/wp-body-edits.mjs).
  //
  // `ppa_tournaments` agrees: PPA Tour Spain has exactly one real row in the
  // feed, this opener (Registration Open, venue Sant Joan Despí). Add a stop
  // back when the feed carries it or the event team confirms date + venue —
  // one line each, in month order.
  //
  // ⚠ BOTH BARCELONA ROWS PIN THEIR OWN PHOTO, AND THE REASON IS THE ONE IN THE
  // VENUE_IMAGES NOTE ABOVE. With no `image`, an international stop falls back to
  // `VENUE_IMAGES[i % 3]` — Melbourne / Macao / Gold Coast — so the P250 card was
  // illustrated with Macao and the P500 with the Gold Coast, and the FEED row (the
  // one /events actually serves) drew Melbourne. Same bug Bryce flagged on 7/28
  // when Las Vegas was showing the Brisbane skyline, one continent over.
  { name: "PPA Spain P250 Barcelona", start: "2026-09-23", end: "2026-09-27", city: "Barcelona", state: "Spain", type: "international", country: "Europe", image: "/ppa/event-barcelona.jpg" },
  { name: "Charlotte PPA Challenger", start: "2026-09-25", end: "2026-09-27", city: "Charlotte", state: "NC", type: "challenger", points: 125 },
  { name: "Rate Las Vegas Open", start: "2026-09-28", end: "2026-10-04", city: "Las Vegas", state: "NV", venue: "Darling Tennis Center", type: "ppa", tier: "open" },

  // October 2026
  { name: "Veolia Chicago Cup", start: "2026-10-05", end: "2026-10-11", city: "Chicago", state: "IL", venue: "Life Time — Northbrook", type: "ppa", tier: "cup" },
  { name: "Sarasota PPA Challenger", start: "2026-10-09", end: "2026-10-11", city: "Englewood", state: "FL", type: "challenger" },
  // ⚠ NO VENUE ON PURPOSE. Bryan Renahan, 8/12: "The venue for Virginia Beach is
  // wrong. Should be 'Pickleball Virginia Beach'." It read "Virginia Beach Sports
  // Center", hand-typed here in May, and back then the mapper resolved
  // `curated?.venue ?? t.venue_name` — so our typo outranked the feed, which has
  // had `venue_name: "Pickleball Virginia Beach"` on all three editions (2024,
  // 2025, 2026) the whole time. Two genuinely different buildings ~2 miles
  // apart, so the map was wrong with it.
  //
  // The feed now wins for every stop (`resolveVenue`, lib/events-api.ts), so
  // this line is no longer what makes it work — but leave it off anyway: a
  // curated venue is the fallback when the API is unreachable, and typing one
  // here would be re-adopting a field we deliberately stopped owning.
  { name: "Mojo Energy Pouches Virginia Beach Open", slug: "virginia-beach-open", start: "2026-10-12", end: "2026-10-18", city: "Virginia Beach", state: "VA", type: "ppa", tier: "open" },
  { name: "PPA 1500 Australia Pickleball Open", start: "2026-10-13", end: "2026-10-18", city: "Australia", state: "", type: "international", country: "Australia" },
  { name: "PPA Asia 1500 Hong Kong Slam", start: "2026-10-19", end: "2026-10-25", city: "Hong Kong", state: "China", type: "international", country: "Asia" },
  { name: "PPA Canada 125 Ottawa", start: "2026-10-22", end: "2026-10-25", city: "Ottawa", state: "Canada", type: "international", country: "Canada" },

  // November 2026
  { name: "Pickleball World Championships", start: "2026-11-02", end: "2026-11-08", city: "Farmers Branch", state: "TX", venue: "Brookhaven Country Club", type: "ppa", tier: "worlds" },
  // ⚠ A PPA Spain P125 sat here (11–15 Nov) on the strength of the 5/27 release
  // alone, with no city. Deleted 8/5 with the other four unconfirmed Spanish
  // stops — see the note on the Barcelona opener above before re-adding one.
  { name: "Proton Daytona Beach Open", start: "2026-11-16", end: "2026-11-22", city: "Holly Hill", state: "FL", venue: "Pictona at Holly Hill", type: "ppa", tier: "open" },
  { name: "PPA Canada 125 Toronto", start: "2026-11-26", end: "2026-11-29", city: "Toronto", state: "Canada", type: "international", country: "Canada" },
  { name: "Veolia Malibu Cup", start: "2026-11-30", end: "2026-12-06", city: "Malibu", state: "CA", venue: "Pepperdine University", type: "ppa", tier: "cup" },

  // December 2026
  { name: "PPA Australia 125 New South Wales", start: "2026-12-11", end: "2026-12-13", city: "New South Wales", state: "Australia", type: "international", country: "Australia" },

  // January 2027
  { name: "PPA Italy 125 Brescia", start: "2027-01-05", end: "2027-01-09", city: "Brescia", state: "Italy", type: "international", country: "Europe" },
  // ⚠ Feed name + pinned slug — see the Nationals note above.
  { name: "Carvana Pickleball Masters Powered by Invited", slug: "carvana-pickleball-masters", start: "2027-01-11", end: "2027-01-17", city: "Rancho Mirage", state: "CA", venue: "Hyatt Regency Indian Wells", type: "ppa", tier: "slam" },
  { name: "Minneapolis Indoor Open", start: "2027-01-18", end: "2027-01-24", city: "Lakeville", state: "MN", venue: "Life Time — Lakeville", type: "ppa", tier: "open" },

  // February 2027
  { name: "Cape Coral Open", start: "2027-02-01", end: "2027-02-07", city: "Cape Coral", state: "FL", venue: "Cape Coral Racquet Club", type: "ppa", tier: "open" },
  { name: "Carvana Mesa Cup", start: "2027-02-15", end: "2027-02-21", city: "Mesa", state: "AZ", venue: "Bell Bank Park", type: "ppa", tier: "cup" },
  { name: "PPA Australia 125 Melbourne", start: "2027-02-18", end: "2027-02-21", city: "Melbourne", state: "Australia", type: "international", country: "Australia" },

  // March 2027
  { name: "Newport Beach Open", start: "2027-03-02", end: "2027-03-07", city: "Newport Beach", state: "CA", venue: "Tennis Club at Newport Beach", type: "ppa", tier: "open" },
  // ⚠ ANNOUNCED, LOCATION NOT SET. Wesley, 8/13: Texas Open, March 8-14 2027,
  // "Location: TBD", on /events but with no page of its own and no link out.
  //
  // ⚠ THE ROW ALREADY EXISTED AND SAID "Dallas, TX · The Courts of McKinney" —
  // a venue and a city nobody has confirmed for this edition, carried over from
  // the May build. It never showed on /events (the feed has no row for this
  // stop, and that page renders the feed), but /events/2027/texas-open WAS
  // prerendered and reachable, publishing that location plus a templated Order
  // of Play, a $1,063,327 purse and a Dallas trip guide. Same class as the 36
  // fabricated international pages (8/6). `detailsComingSoon` closes the page
  // and puts the card on /events instead.
  //
  // When the venue is confirmed: set `city`/`state`/`venue`, drop the flag, and
  // restore a trip guide (the Dallas one is deleted — see lib/event-guides.ts).
  { name: "Texas Open", start: "2027-03-08", end: "2027-03-14", city: "TBD", state: "", type: "ppa", tier: "open", detailsComingSoon: true },
  { name: "PPA Australia 250 Sydney Finals", start: "2027-03-17", end: "2027-03-21", city: "Sydney", state: "Australia", type: "international", country: "Australia" },
  // ⚠ Feed name + pinned slug. NOTE this one is SHORTER than what we had — the
  // feed drops "at Black Desert Resort". Flagged to Jeff; if the resort should
  // stay, the fix belongs in the feed, not here.
  { name: "Greater Zion Cup", slug: "greater-zion-cup-at-black-desert-resort", start: "2027-03-22", end: "2027-03-28", city: "St. George", state: "UT", venue: "Black Desert Resort", type: "ppa", tier: "cup" },

  // April 2027
  { name: "PPA Open", start: "2027-04-05", end: "2027-04-11", city: "TBD", state: "", type: "ppa", tier: "open" },
  { name: "Sacramento Open", start: "2027-04-05", end: "2027-04-11", city: "Sacramento", state: "CA", venue: "Life Time — Arden", type: "ppa", tier: "open" },
  // No venue: Bryan Renahan, 8/4 — "Cincy should not have Lindner Family Tennis
  // Center listed anywhere. No venue for now." Falls back to the city until a
  // venue is confirmed; don't re-add one without him.
  { name: "Cincinnati Open", start: "2027-04-12", end: "2027-04-18", city: "Cincinnati", state: "OH", type: "ppa", tier: "open" },
  { name: "Pickleball Players Championships", slug: "atlanta-pickleball-championships", start: "2027-04-26", end: "2027-05-02", city: "Atlanta", state: "GA", venue: "Life Time — Peachtree Corners", type: "ppa", tier: "slam" },

  // May 2027
  // Photo pinned for the same reason as the September opener — see that note.
  { name: "PPA Spain P500 Barcelona", start: "2027-05-05", end: "2027-05-09", city: "Barcelona", state: "Spain", type: "international", country: "Europe", image: "/ppa/event-barcelona.jpg" },
  { name: "PPA Finals", start: "2027-05-10", end: "2027-05-16", city: "San Clemente", state: "CA", venue: "Life Time — Rancho San Clemente", type: "ppa", tier: "slam" },
];

// Recent completed events — power the /events Past tab + Season filter.
/**
 * Completed events. Written without `eventCode` and stamped below — the code is
 * derived from city/state/endDate, so hand-writing it 10 times would just be 10
 * chances to typo the join key.
 */
const PAST_EVENTS: Tournament[] = ([
  {
    slug: "carvana-utah-open",
    name: "Carvana Utah Open",
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
    image: "/ppa/action-singles.jpg",
    season: "2025-2026",
  },
  {
    slug: "veolia-kansas-city-cup",
    name: "Veolia Kansas City Cup",
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
    image: "/ppa/action-mxd.jpg",
    season: "2025-2026",
  },
  {
    slug: "orlando-open",
    name: "Orlando Open",
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
    slug: "los-angeles-slam",
    name: "Los Angeles Slam",
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
    // ⚠ LOAD-BEARING FOR THE UPCOMING AUG 28 ATLANTA STOP, NOT JUST THIS ROW.
    // The feed titles that event "Atlanta PPA Challenger", which kebabs to
    // THIS record's slug — the SCHEDULE row took `-2026-08-28` as the dupe
    // suffix — so `findCurated` hands the live event this record's points.
    // Both are set to 125 (events team, 8/5); keep them in step.
    points: 125,
    prizeMoney: "$25,000",
    image: "/ppa/action-mxd.jpg",
    season: "2025-2026",
  },
  {
    slug: "newport-beach-open",
    name: "Newport Beach Open",
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
    slug: "dallas-slam",
    name: "Dallas Open",
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
    slug: "phoenix-cup",
    name: "Phoenix Cup",
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
    slug: "miami-open",
    name: "Miami Open",
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
] as Omit<Tournament, "eventCode">[]).map((e) => ({
  ...e,
  eventCode: eventCode(e),
}));

export const tournaments: Tournament[] = [
  ...buildSchedule(SCHEDULE, new Set(PAST_EVENTS.map((e) => e.slug))),
  ...PAST_EVENTS,
];

/** Ranking points for an event, from its tier. */
export function tierPoints(t: Pick<Tournament, "tierKey"> & { points?: number }): number {
  return t.points ?? TIER_META[t.tierKey].points;
}

/** Short tier label, e.g. "Championship". */
export function tierShort(t: Pick<Tournament, "tierKey">): string {
  return TIER_META[t.tierKey].short;
}

/** Full tier label, e.g. "PPA Tour Championship". */
export function tierLabel(t: Pick<Tournament, "tierKey">): string {
  return TIER_META[t.tierKey].label;
}

/**
 * The four Majors (Connor, 7/23) — the crown-jewel stops, a curated
 * designation independent of the points tier: the Masters, the Players
 * (Atlanta), Nationals, and Worlds. Matched by curated slug and, as a
 * backstop for API-sourced records, by name — never a Challenger, and
 * PPA Finals is intentionally excluded (2,000-pt but not a Major).
 */
const MAJOR_SLUGS = new Set([
  "carvana-pickleball-masters",
  "atlanta-pickleball-championships",
  "veolia-pickleball-national-championships",
  "pickleball-world-championships",
]);

export function isMajor(t: Pick<Tournament, "slug" | "name" | "tierKey">): boolean {
  if (t.tierKey === "challenger") return false;
  if (MAJOR_SLUGS.has(t.slug)) return true;
  const n = t.name.toLowerCase();
  if (/challenger/.test(n)) return false;
  return (
    /national championship/.test(n) ||
    /world championship/.test(n) ||
    /\bmasters\b/.test(n) ||
    (/atlanta/.test(n) && /championship/.test(n))
  );
}

/** Badge short label — "Major" for the four Majors, else the tier short. */
export function eventTierShort(t: Pick<Tournament, "slug" | "name" | "tierKey">): string {
  return isMajor(t) ? "Major" : tierShort(t);
}

/** Full badge label — "PPA Major" for the four Majors, else the tier label. */
export function eventTierLabel(t: Pick<Tournament, "slug" | "name" | "tierKey">): string {
  return isMajor(t) ? "PPA Major" : tierLabel(t);
}

/* ---- event names in prose ---- */

/**
 * Does this event's name take a PLURAL verb? "The Championships matter", not
 * "matters".
 *
 * ⚠ This exists because event names go into templated sentences and 8/3 made
 * `name` the full sponsored name in all of them. "Why {name} Matters" is correct
 * for the Rate Las Vegas Open and wrong for the Veolia Pickleball National
 * Championships, and the same template renders both — so the verb has to agree
 * with the name rather than being hard-coded either way.
 *
 * Only "Championships" and "Finals" are treated as plural, and both are
 * unambiguous. "Masters" is deliberately NOT: a Masters is a single tournament
 * and takes a singular verb, the same way golf's does ("The Masters is").
 */
export function eventTakesPluralVerb(name: string): boolean {
  return /\b(championships|finals)\s*$/i.test(name);
}

/**
 * The event name with a definite article, for prose. Idempotent — a name that
 * already starts with "The" (the feed sends "The Carvana Masters Powered by
 * Invited") doesn't get a second one.
 */
export function eventNameWithThe(name: string): string {
  const n = name.trim();
  return /^the\s/i.test(n) ? n : `The ${n}`;
}

/**
 * "Why The Veolia Pickleball National Championships Matter" / "Why The Rate Las
 * Vegas Open Matters" — the What's at Stake heading, agreeing with the name.
 * Requested 8/5; it read "Why {name} Matters" for every stop, which the 8/3
 * full-name change had left ungrammatical on the four Championships events.
 */
export function whyItMattersHeading(name: string): string {
  return `Why ${eventNameWithThe(name)} ${eventTakesPluralVerb(name) ? "Matter" : "Matters"}`;
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
    tournamentName: next.name,
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

/**
 * One tier -> one visual identity, shared by every surface that badges an event.
 *
 * Triage item #14 — Brian Clark and Dana, 29 Jul: "Majors, Cups and Opens don't
 * differ enough at a glance." Every badge was the same yellow chip, so a 500-pt
 * Challenger and a 3,000-pt Worlds were identical and differed only in the word
 * inside them. The tier ladder Bryce ruled on was invisible on the pages it
 * organises.
 *
 * The ramp follows the points ladder, brightest at the top:
 *   Major / Worlds   yellow on navy   the four Majors + Worlds (3,000)
 *   Championship     white on navy    the 2,000-pt Finals, NOT a Major
 *   Cup              navy on sky      1,500
 *   Open             navy on white    1,000, the tour floor
 *   Challenger       muted            under 1,000, recessive on purpose
 *
 * Exposed two ways off ONE decision, so the surfaces can't drift:
 *   tierBadgeClass()   Tailwind colours, for pages
 *   tierBadgeColors()  hex, for the next/og share cards (Satori can't use
 *                      Tailwind, and it previously hardcoded its own colour)
 *
 * Colours only — no padding or font size. Each site sets its own, because the
 * event hero runs at 11px/0.16em tracking while the grid chips are 9px/0.08em.
 */
type TierBadgeKey = "major" | "championship" | "cup" | "open" | "challenger";

function tierBadgeKey(
  t: Pick<Tournament, "slug" | "name" | "tierKey">,
): TierBadgeKey {
  if (isMajor(t) || t.tierKey === "worlds") return "major";
  switch (t.tierKey) {
    case "slam":
      return "championship";
    case "cup":
      return "cup";
    case "open":
      return "open";
    default:
      return "challenger";
  }
}

/** Tailwind background/text classes for a tier chip. */
export function tierBadgeClass(
  t: Pick<Tournament, "slug" | "name" | "tierKey">,
): string {
  switch (tierBadgeKey(t)) {
    case "major":
      return "bg-ppa-yellow text-ppa-navy";
    case "championship":
      return "bg-ppa-navy text-white";
    case "cup":
      return "bg-ppa-sky text-ppa-navy";
    case "open":
      return "bg-white text-ppa-navy";
    default:
      return "bg-ppa-navy/70 text-white/75 ring-1 ring-inset ring-white/25";
  }
}

/** Same decision as hex, for Satori-rendered OG cards. */
export function tierBadgeColors(
  t: Pick<Tournament, "slug" | "name" | "tierKey">,
): { bg: string; fg: string } {
  switch (tierBadgeKey(t)) {
    case "major":
      return { bg: "#E7E700", fg: "#0C2B44" };
    case "championship":
      return { bg: "#0C2B44", fg: "#FFFFFF" };
    case "cup":
      return { bg: "#4DC1EF", fg: "#0C2B44" };
    case "open":
      return { bg: "#FFFFFF", fg: "#0C2B44" };
    default:
      return { bg: "#1F3B52", fg: "#D7DEE4" };
  }
}
