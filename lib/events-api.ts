/**
 * Events adapter — Pickleball.com `ppa_tournaments` endpoint.
 *
 *   GET {base}/v2/data/ppa_tournaments?page_size=300
 *   header  PB-API-TOKEN: <token>
 *   → { results: { tournaments: [ { ...tournament } ] } }
 *
 * This is the authoritative tour calendar (all PPA orgs — US, Australia, Asia,
 * Italy, Spain — past + upcoming). It drives the /events listing and the
 * internal event pages for US ("Pro Pickleball Association") stops.
 *
 * The API is sparse (no tier / points / ticket price / hero art / brand), so we
 * ENRICH each event from the curated `tournaments` list when we recognize it
 * (exact slug or a small alias map) — flagship stops keep their curated slug,
 * imagery, brand, guide, schedule, and broadcast; everything else is derived.
 *
 * Server-only (reads the token). Never throws — falls back to the curated list
 * on any problem so the page always renders.
 */

import { asiaTourUrlForDetailsUrl } from "@/lib/asia-tour-links";
import { eventCode } from "@/lib/event-code";
import {
  type EventTier,
  brandForSlug,
  GENERIC_IMAGES,
  getAllEvents,
  kebab,
  pointsFromName,
  SPONSORS,
  TIER_PRICE,
  TIER_PRIZE,
  tierFromName,
  VENUE_IMAGES,
  type Tournament,
} from "@/lib/placeholder-data";
import { venueGalleryFor, venueHeroFor } from "@/lib/venue-photos";
import { ticketPriceFrom, ticketsOnSale } from "@/lib/tixr-price-index";

const PATH = "/v2/data/ppa_tournaments";
/**
 * Cache tag for the tournaments fetch. A Vercel Cron hits
 * `/api/revalidate-events` at midnight Central and calls `revalidateTag` with
 * this, so the calendar refreshes once a day on a predictable schedule.
 */
export const EVENTS_CACHE_TAG = "events";
/** Backstop TTL (24h) in case the daily cron ever fails to fire. */
const REVALIDATE_SECONDS = 60 * 60 * 24;
const TIMEOUT_MS = 8000;

/** The US org — the only one whose events get a rich internal event page. */
const US_ORG = "Pro Pickleball Association";

/** Fields we read from one `results.tournaments[]` entry. */
type ApiTournament = {
  tournament_uuid: string;
  title: string;
  organization_name: string;
  start_date: string;
  end_date: string;
  venue_name: string;
  venue_city: string;
  venue_state: string;
  venue_country: string;
  registration_cost: number;
  logo_url: string;
  details_url: string;
  tournament_status: string; // Upcoming | Registration Open | In Progress | Completed | Cancelled
  is_canceled: boolean;
  is_stub: boolean;
  is_advertise_only: boolean;
  prize_award_info: string;
};

function config() {
  const token = process.env.PB_API_TOKEN;
  const baseUrl = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, baseUrl };
}

/**
 * Strip the "PPA Tour:" prefix and a leading year from the event title.
 *
 * Connor 7/29 ("those Australia names are insane"): the sister-tour feeds send
 * the venue, the host club and the sanctioning body all inside one title —
 * "Australia PPA Tour Northern Crocs Qualifier @ Raya Pickleball Club". We
 * drop the trailing "@ venue" (the venue already renders on the card), the
 * leading region word the country chip already says, and any doubled spacing.
 */
function cleanTitle(title: string): string {
  return title
    .replace(/^PPA Tour:\s*/i, "")
    .replace(/^\d{4}\s+/, "")
    // "… @ Raya Pickleball Club" / "…@House of Pickle" — the venue field has it.
    .replace(/\s*@\s*[^@]+$/, "")
    // Leading region/org word — the country chip and the region filter say it.
    .replace(/^(Australia|Asia|Italy|Spain|Canada|USA)\s+(?=\S)/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** ISO datetime → yyyy-mm-dd ("" if missing). */
function dateOnly(iso: string | undefined): string {
  return typeof iso === "string" ? iso.slice(0, 10) : "";
}

/* ---- curated enrichment ---- */

// API-derived slugs that name a curated event under a different slug.
const CURATED_ALIASES: Record<string, string> = {
  "veolia-ppa-national-championships": "veolia-pickleball-national-championships",
  "greater-zion-cup": "greater-zion-cup-at-black-desert-resort",
  "carvana-pickleball-masters-powered-by-invited": "carvana-pickleball-masters",
  // The feed lists Atlanta under its event name; map it to our curated record so
  // the name, logo, and event page all attach (Tyler, 8/4).
  "pickleball-players-championships": "atlanta-pickleball-championships",
  // The feed renamed VB Open to include the Mojo title sponsor; map its new
  // slug back to our curated record so the badge + venue photo re-attach.
  "mojo-energy-pouches-virginia-beach-open": "virginia-beach-open",
  // ⚠ WITHOUT THIS LINE THE BARCELONA OPENER GETS NO CURATED RECORD, AND SO NO
  // PHOTO. The feed titles it "PPA TOUR SPAIN - P250 BARCELONA OPEN" where we
  // carry "PPA Spain P250 Barcelona", so the derived slugs differ and
  // `findCurated` missed — leaving the one PPA Spain stop that IS in the feed
  // (i.e. the only one /events renders) falling through to VENUE_IMAGES and
  // publishing the Melbourne skyline on a Barcelona card. Same shape as the Mojo
  // line above, and the same class of drift as the Asia stops (8/6), where the
  // feed and curated paths built two different slugs for one event.
  "ppa-tour-spain-p250-barcelona-open": "ppa-spain-p250-barcelona",
};

const curatedBySlug = new Map<string, Tournament>(getAllEvents().map((t) => [t.slug, t]));

function findCurated(apiSlug: string): Tournament | null {
  return curatedBySlug.get(CURATED_ALIASES[apiSlug] ?? apiSlug) ?? null;
}

/**
 * Per-event NAME overrides that win over the feed title (Tyler, 8/4). The feed
 * is normally the system of record ("the feed's title wins" — see the note in
 * `enrich`), but it lags the on-site branding for these stops, so the site was
 * showing an outdated name on the /events cards. Keyed by the RESOLVED (curated)
 * slug. Remove a row the moment the feed matches — this is a stopgap, not a new
 * source of truth, and it does NOT touch slugs/URLs.
 */
const NAME_OVERRIDE_BY_SLUG: Record<string, string> = {
  "veolia-pickleball-national-championships": "Veolia Pickleball National Championships",
  "virginia-beach-open": "Mojo Energy Pouches Virginia Beach Open",
  "atlanta-pickleball-championships": "Pickleball Players Championships",
};

/**
 * ⚠ VENUES COME FROM THE FEED (Wesley, 8/13), the same ruling names got on 8/3.
 * `ppa_tournaments` is the tour's own system of record: an event plays wherever
 * it is registered as playing, and a venue corrected there now reaches the site
 * with no code change — hero, quick facts, venue guide, the map pin, the
 * concierge and search all at once.
 *
 * This reverses `curated?.venue ?? t.venue_name`, which is how Virginia Beach
 * came to publish "Virginia Beach Sports Center" for two seasons while the feed
 * said "Pickleball Virginia Beach" (Bryan Renahan, 8/12 — two different
 * buildings ~2 miles apart, so the map was wrong with it). Hand-typed in May,
 * outranking the feed, and nothing could correct it but a commit.
 *
 * ⚠ MEASURED BEFORE IT SHIPPED: 21 of the 27 events the feed and the curated
 * calendar both carry disagreed. Most were us being stale — Mesa still said
 * "Bell Bank Park" (renamed Arizona Athletic Grounds), the Masters said "Hyatt
 * Regency Indian Wells" where the feed AND our own venue-photo library say
 * Mission Hills, and five Challengers named only their city. Those are the win.
 * The rest is what the two guards below exist for.
 */
const VENUE_PLACEHOLDER = /^(tba|tbd|n\.?\/?a\.?|none|unknown|test)$/i;

/**
 * Events where the CURATED venue still wins because the feed's is demonstrably
 * wrong — a misspelling, not a rename we're behind on.
 *
 * ⚠ EVERY LINE HERE IS A BUG REPORT, NOT A PREFERENCE, AND THE REAL FIX IS
 * UPSTREAM. Correct the row in PB Tournaments and delete the line; the feed
 * takes over on the next revalidate. Do NOT add a stop here because the feed's
 * spelling is merely uglier than ours — "Life Time Arden" for our "Life Time —
 * Arden" is the feed being plain, not wrong, and it is allowed through on
 * purpose. The whole point of this change is to stop owning this field.
 */
const VENUE_CURATED_WINS: Record<string, string> = {
  // Feed: "Cary Tennis Center". The Town of Cary's own facility is Cary Tennis
  // Park (carync.gov). Wrong on the flagship event, 18 days out.
  "veolia-pickleball-national-championships": "Cary Tennis Center",
  // Feed: "Life Time Peach Tree Corners". Peachtree Corners is one word — it is
  // the name of the city the club is in.
  "atlanta-pickleball-championships": "Life Time Peach Tree Corners",
  // Feed: "Lifetime Lakeville". The brand is two words, "Life Time", as the
  // feed itself writes it on Arden, Rancho San Clemente and North Shore.
  "minneapolis-indoor-open": "Lifetime Lakeville",
};

/**
 * The venue an event actually plays at: the feed's, unless it can't answer.
 *
 * ⚠ TWO GUARDS, AND BOTH ARE LOAD-BEARING RATHER THAN DEFENSIVE:
 *
 * 1. A PLACEHOLDER IS NOT AN ANSWER. Cincinnati 2027's `venue_name` is the
 *    literal string "TBD", and publishing "Venue: TBD" is worse than the city
 *    we show today — worse still because Bryan banned naming a Cincinnati venue
 *    outright on 8/4, and this is the field that would have crept one back in.
 * 2. THE CITY IS NOT A VENUE. Some rows repeat the city in `venue_name`, which
 *    carries no information the card doesn't already print, so a curated venue
 *    beats it.
 *
 * Falling back to the curated row is also what keeps every stop the feed has
 * never heard of working — the international sister-tour stops, Texas Open 2027,
 * PPA Open — and what the site serves when the API is unreachable.
 */
export function resolveVenue(
  slug: string,
  curatedVenue: string | undefined,
  feedVenue: string | undefined,
  feedCity: string | undefined,
): string {
  const curated = (curatedVenue ?? "").trim();
  const feed = (feedVenue ?? "").trim();
  const city = (feedCity ?? "").trim();

  if (VENUE_CURATED_WINS[slug] && curated) return curated;
  if (!feed || VENUE_PLACEHOLDER.test(feed)) return curated || city;
  if (feed.toLowerCase() === city.toLowerCase() && curated) return curated;
  return feed;
}

/* ---- field inference ---- */

/**
 * Events that are NOT the PPA Tour and never belong on ppatour.com — third-party
 * minor leagues running on the same tournament platform. Connor 7/29: "I'd
 * rather get rid of anything that says the Dink Minor League."
 */
const NON_TOUR_NAME = /minor league|the dink\b|dink minor/i;

/**
 * Names that are real PPA properties but structurally NOT a 1,000-point tour
 * stop — qualifiers, club/league play, junior + senior draws, camps. Before
 * this, `inferTier` defaulted every unrecognized event to "open" (1,000), which
 * is why one-day MLP qualifiers at Australian clubs were sitting in the
 * "1,000+ Points / Next Six on Tour" band (Connor 7/29).
 */
const SUB_TOUR_NAME =
  /qualifier|\bleague\b|\bjunior\b|\bsenior\b|\bcamp\b|clinic|club championship|amateur|\bopen play\b/i;

/** Tier from the event title (no points in the feed); challengers detected upstream.
 *  A points number in the name (international stops carry one — "1500", "P250",
 *  "125") is authoritative and wins over keyword inference. */
function inferTier(name: string, days: number): EventTier {
  const byPoints = tierFromName(name);
  if (byPoints) return byPoints;
  if (/world championship|world pickleball/i.test(name)) return "worlds";
  if (/\bslam\b|masters|national championship|nationals|finals/i.test(name)) return "slam";
  if (/\bcup\b/i.test(name)) return "cup";
  if (SUB_TOUR_NAME.test(name)) return "challenger";
  // A 1,000+ tour stop is a multi-day event — every stop on the calendar runs
  // four days or more. A one- or two-day event is club/qualifier play whatever
  // it calls itself, so it never inherits the 1,000-point default.
  if (days > 0 && days < 3) return "challenger";
  return "open";
}

/** Inclusive day count for an event, 0 when either date is missing. */
function eventDays(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 0;
  const ms = Date.parse(endIso) - Date.parse(startIso);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 86_400_000) + 1;
}

const COUNTRY_BY_CODE: Record<string, Tournament["country"]> = {
  AUS: "Australia",
  NZL: "Australia",
  VNM: "Asia",
  MYS: "Asia",
  HKG: "Asia",
  JPN: "Asia",
  CHN: "Asia",
  SGP: "Asia",
  MAC: "Asia",
  // Europe is one entry, not a country list (Connor, 7/31) — the sister tours
  // run Italy/Slovenia/Spain today and the filter shouldn't grow a row every
  // time they add a stop.
  ITA: "Europe",
  SVN: "Europe",
  ESP: "Europe",
  FRA: "Europe",
  GBR: "Europe",
  DEU: "Europe",
  PRT: "Europe",
  NLD: "Europe",
  AUT: "Europe",
  CHE: "Europe",
  BEL: "Europe",
  SWE: "Europe",
  NOR: "Europe",
  DNK: "Europe",
  POL: "Europe",
  CZE: "Europe",
  GRC: "Europe",
  CAN: "Canada",
};

function inferCountry(org: string, code: string): Tournament["country"] | undefined {
  if (/australia/i.test(org)) return "Australia";
  if (/asia/i.test(org)) return "Asia";
  if (/italy|spain|europe/i.test(org)) return "Europe";
  return COUNTRY_BY_CODE[code];
}

function inferSeason(startIso: string): Tournament["season"] | undefined {
  const year = startIso.slice(0, 4);
  if (year === "2026" || year === "2027") return "2025-2026";
  if (year === "2025" || year === "2024" || year === "2023" || year === "2022") {
    return year as Tournament["season"];
  }
  return undefined;
}

function mapStatus(s: string): Tournament["status"] {
  if (s === "Completed") return "completed";
  if (s === "In Progress") return "live";
  return "upcoming";
}

/** Drop cancelled, advertise-only, stub, dateless, and "Additional Events" noise —
 *  plus third-party minor-league events that aren't ours to promote. */
function isJunk(t: ApiTournament): boolean {
  return (
    t.is_canceled ||
    t.is_stub ||
    t.is_advertise_only ||
    t.tournament_status === "Cancelled" ||
    /additional events/i.test(t.title) ||
    // "PPA Spain: Template" — an unfilled record the sister tours leave in the
    // feed. It was rendering as a live 1,000-point stop (Connor, 7/29).
    /\btemplate\b|\btest event\b|\bTBD\b/i.test(t.title) ||
    NON_TOUR_NAME.test(t.title) ||
    !t.start_date
  );
}

function mapTournament(t: ApiTournament, seen: Set<string>, index: number): Tournament {
  const name = cleanTitle(t.title);
  const isUsOrg = t.organization_name === US_ORG;
  const isChallenger = /challenger/i.test(name);
  const startDate = dateOnly(t.start_date);

  // Prefer the curated slug (so guides/broadcast/brand + existing URLs light up);
  // otherwise a kebab of the title. The year now lives in the path
  // (/events/{year}/{slug}), so slugs stay year-free and only need to be unique
  // within a year — a numeric suffix breaks the rare same-year, same-name clash.
  const year = startDate.slice(0, 4);
  const curated = findCurated(kebab(name));
  const base = curated?.slug ?? kebab(name);
  let slug = base;
  let n = 1;
  while (seen.has(`${year}/${slug}`)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  seen.add(`${year}/${slug}`);

  const endDate = dateOnly(t.end_date) || startDate;
  const tier: EventTier =
    curated?.tierKey ??
    (isChallenger ? "challenger" : inferTier(name, eventDays(startDate, endDate)));
  const status = mapStatus(t.tournament_status);

  return {
    slug,
    // ⚠ THE FEED'S TITLE WINS. Wesley, 8/3: use the API names only — the feed is
    // the tour's own system of record, so an event is called whatever it is
    // registered as, and a rename there reaches the site without a code change.
    //
    // This is a REVERSAL of the earlier `curated?.name ?? name`, and it is a
    // visible one on three stops. Measured against all 220 rows:
    //   Veolia Pickleball National Championships -> Veolia PPA National Championships
    //   Carvana Pickleball Masters               -> Carvana Pickleball Masters Powered by Invited
    //   Greater Zion Cup at Black Desert Resort  -> Greater Zion Cup
    // The last one is SHORTER than the curated spelling — the feed drops the
    // resort. Flagged to Jeff; if any of these read wrong the fix belongs in the
    // feed, not here.
    //
    // Curated stays the fallback for the two cases the feed can't answer: stops
    // absent from it (Proton Daytona Beach Open, Texas Open 2027, PPA Open) and
    // every event when the API is unreachable and we serve `buildSchedule`.
    //
    // ⚠ SLUGS ARE UNAFFECTED AND MUST STAY THAT WAY. `base` above is
    // `curated?.slug ?? kebab(name)`, so the curated slug still wins and URLs
    // don't move. Do NOT "tidy" this by renaming the curated ROWS to match —
    // buildSchedule derives the slug from the curated name, so that would
    // silently repoint every event URL, brand, guide, broadcast and photo key.
    name: NAME_OVERRIDE_BY_SLUG[slug] ?? (name || curated?.name || ""),
    city: curated?.city ?? (t.venue_city || ""),
    state: curated?.state ?? (t.venue_state || ""),
    // ⚠ The feed's venue wins — see `resolveVenue` for the two guards and for
    // the three events whose feed row is wrong enough to override.
    venue: resolveVenue(slug, curated?.venue, t.venue_name, t.venue_city),
    startDate,
    endDate,
    // Tixr first, then whatever the curated record says, then the tier table.
    ticketPriceFrom:
      ticketPriceFrom(curated?.ticketsUrl ?? t.details_url) ??
      curated?.ticketPriceFrom ??
      TIER_PRICE[tier],
    ticketsOnSale: ticketsOnSale(curated?.ticketsUrl ?? t.details_url),
    ticketsUrl: curated?.ticketsUrl ?? t.details_url,
    registerUrl: t.details_url || curated?.registerUrl || "",
    status,
    // Same join key as the curated builder — an API-sourced event must be
    // attributable in Jackalope too, so this is derived here rather than
    // looked up in a static table.
    eventCode: eventCode({
      city: curated?.city ?? (t.venue_city || ""),
      state: curated?.state ?? (t.venue_state || ""),
      endDate,
    }),
    tierKey: tier,
    // Sub-1,000 stops keep their real level (125 / 250 / 500) — the flat
    // Challenger tier reads 500 for all of them otherwise.
    //
    // ⚠ THE CURATED VALUE HAS TO COME FIRST, AND /events IS WHY. The feed
    // carries NO points field (verified against all 220 rows — the only
    // adjacent key is `skill_levels`), and a U.S. Challenger states no
    // number in its title, so `pointsFromName` can never answer for one.
    // Without the curated overlay this line would keep publishing 500 on
    // the feed-driven /events grid while the curated list said 250 — the
    // same half-applied split as the 8/3 name pass.
    points:
      tier === "challenger" ? (curated?.points ?? pointsFromName(name) ?? undefined) : undefined,
    prizeMoney: curated?.prizeMoney ?? TIER_PRIZE[tier],
    // Curated-only: see PRESENTER_BY_SLUG. Never infer a presenter from the
    // title sponsor in the name — that fabricated 6 of 10 presenters (8/4).
    presentedBy: curated?.presentedBy,
    // Venue scenes for main-tour cards, action shots for the smaller
    // Challenger/international treatments (see docs/VENUE-ASSETS.md).
    // The event's own venue photography (synced from Jackalope) leads, then
    // the curated override. VENUE_IMAGES are Melbourne/Macao/Gold Coast city
    // shots — they only ever illustrate international stops now (Bryce, 7/28).
    image:
      venueHeroFor(slug) ??
      curated?.image ??
      (!isUsOrg
        ? VENUE_IMAGES[index % VENUE_IMAGES.length]
        : GENERIC_IMAGES[index % GENERIC_IMAGES.length]),
    gallery: venueGalleryFor(slug).length ? venueGalleryFor(slug) : curated?.gallery,
    // Fall back to the badge-by-slug when the matched curated record has no
    // brand (e.g. a past-season duplicate that won the slug), so events like
    // the 2027 Newport Beach Open still get their crest.
    brand: curated?.brand ?? brandForSlug(slug),
    region: isUsOrg ? undefined : "international",
    country: isUsOrg ? undefined : inferCountry(t.organization_name, t.venue_country),
    season: status === "completed" ? inferSeason(startDate) : undefined,
    tournamentUuid: t.tournament_uuid,
    // ⚠ THE ASIA TOUR'S OWN PAGE WINS OVER THE FEED'S `details_url`. Wade (PPA
    // Tour Asia) via Wesley, 8/6: their stops were linking to a
    // pickleballtournaments.com holding page; they publish a real page per
    // tournament. Unlisted events are untouched — see lib/asia-tour-links.ts,
    // which fails safe back to this URL and has an audit script for the drift.
    externalUrl: asiaTourUrlForDetailsUrl(t.details_url) ?? (t.details_url || undefined),
    // US main-tour + curated events get a rich internal page; challengers and
    // international sister-tour stops link out to their details_url instead.
    //
    // ⚠ A CURATED RECORD ONLY GRANTS A PAGE IF IT CLAIMS ONE. This read
    // `isUsOrg || Boolean(curated)`, i.e. merely RECOGNIZING an event promoted it
    // to an internal page — so adding the Barcelona alias above, purely to attach
    // its photo, flipped a PPA Tour Spain stop to `hasInternalPage: true` and sent
    // its /events card at our own URL instead of the tour that runs it. The
    // curated row already answers this question explicitly (`r.type === "ppa"`),
    // for exactly the reason the 8/6 gate note gives, so ask it rather than
    // inferring from its existence. `isUsOrg` is untouched, so no US stop moves.
    hasInternalPage: !isChallenger && (isUsOrg || curated?.hasInternalPage === true),
    logoUrl: t.logo_url || undefined,
    source: "api",
  };
}

/** Curated fallback list, tagged so callers can tell it's not live data. */
function fallback(): { events: Tournament[]; source: "fallback" } {
  return { events: getAllEvents().map((t) => ({ ...t, source: "curated" as const })), source: "fallback" };
}

/**
 * Every tour event from the API (quality-gated, mapped, curated-enriched),
 * chronological. Falls back to the curated list if the API is unconfigured,
 * errors, or returns nothing. Safe to call from server components.
 */
export async function getEvents(): Promise<{ events: Tournament[]; source: "live" | "fallback" }> {
  const { token, baseUrl } = config();
  if (!token) return fallback();

  try {
    const res = await fetch(`${baseUrl}${PATH}?current_page=1&page_size=300`, {
      headers: { "PB-API-TOKEN": token },
      next: { revalidate: REVALIDATE_SECONDS, tags: [EVENTS_CACHE_TAG] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return fallback();

    const json = (await res.json()) as { results?: { tournaments?: ApiTournament[] } };
    const raw = json.results?.tournaments ?? [];
    if (raw.length === 0) return fallback();

    const seen = new Set<string>();
    const events = raw
      .filter((t) => !isJunk(t))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .map((t, i) => mapTournament(t, seen, i));

    if (events.length === 0) return fallback();
    return { events, source: "live" };
  } catch {
    return fallback();
  }
}

/**
 * Resolve a single event that should have an internal page, by slug. Returns
 * null for unknown slugs or events that link out (international sister tours),
 * so the detail route can `notFound()`.
 */
export async function getInternalEvent(slug: string): Promise<Tournament | null> {
  const { events } = await getEvents();
  const found = events.find((e) => e.slug === slug);
  return found && found.hasInternalPage ? found : null;
}
