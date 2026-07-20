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

import {
  type EventTier,
  GENERIC_IMAGES,
  getAllEvents,
  kebab,
  SPONSORS,
  TIER_PRICE,
  TIER_PRIZE,
  VENUE_IMAGES,
  type Tournament,
} from "@/lib/placeholder-data";

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

/** Strip the "PPA Tour:" prefix and a leading year from the event title. */
function cleanTitle(title: string): string {
  return title
    .replace(/^PPA Tour:\s*/i, "")
    .replace(/^\d{4}\s+/, "")
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
};

const curatedBySlug = new Map<string, Tournament>(getAllEvents().map((t) => [t.slug, t]));

function findCurated(apiSlug: string): Tournament | null {
  return curatedBySlug.get(CURATED_ALIASES[apiSlug] ?? apiSlug) ?? null;
}

/* ---- field inference ---- */

/** Tier from the event title (no points in the feed); challengers detected upstream. */
function inferTier(name: string): EventTier {
  if (/world championship|world pickleball/i.test(name)) return "worlds";
  if (/\bslam\b|masters|national championship|nationals|finals/i.test(name)) return "slam";
  if (/\bcup\b/i.test(name)) return "cup";
  return "open";
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
  ITA: "Italy",
  SVN: "Italy",
  ESP: "Spain",
  CAN: "Canada",
};

function inferCountry(org: string, code: string): Tournament["country"] | undefined {
  if (/australia/i.test(org)) return "Australia";
  if (/asia/i.test(org)) return "Asia";
  if (/italy/i.test(org)) return "Italy";
  if (/spain/i.test(org)) return "Spain";
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

/** Drop cancelled, advertise-only, stub, dateless, and "Additional Events" noise. */
function isJunk(t: ApiTournament): boolean {
  return (
    t.is_canceled ||
    t.is_stub ||
    t.is_advertise_only ||
    t.tournament_status === "Cancelled" ||
    /additional events/i.test(t.title) ||
    !t.start_date
  );
}

function mapTournament(t: ApiTournament, seen: Set<string>, index: number): Tournament {
  const name = cleanTitle(t.title);
  const isUsOrg = t.organization_name === US_ORG;
  const isChallenger = /challenger/i.test(name);
  const startDate = dateOnly(t.start_date);

  // Prefer the curated slug (so guides/broadcast/brand + existing URLs light up);
  // otherwise a unique kebab of the title, disambiguated by year on collision.
  const curated = findCurated(kebab(name));
  let slug = curated?.slug ?? kebab(name);
  if (!curated) {
    let candidate = slug;
    let n = 0;
    while (seen.has(candidate)) {
      n += 1;
      candidate = n === 1 ? `${slug}-${startDate.slice(0, 4)}` : `${slug}-${startDate.slice(0, 4)}-${n}`;
    }
    slug = candidate;
  }
  seen.add(slug);

  const tier: EventTier = curated?.tierKey ?? (isChallenger ? "challenger" : inferTier(name));
  const status = mapStatus(t.tournament_status);
  const sponsor = SPONSORS.find((s) => name.startsWith(s));

  return {
    slug,
    name: curated?.name ?? name,
    shortName: curated?.shortName ?? name,
    city: curated?.city ?? (t.venue_city || ""),
    state: curated?.state ?? (t.venue_state || ""),
    venue: curated?.venue ?? (t.venue_name || t.venue_city || ""),
    startDate,
    endDate: dateOnly(t.end_date) || startDate,
    ticketPriceFrom: curated?.ticketPriceFrom ?? TIER_PRICE[tier],
    ticketsUrl: curated?.ticketsUrl ?? t.details_url,
    registerUrl: t.details_url || curated?.registerUrl || "",
    status,
    tierKey: tier,
    prizeMoney: curated?.prizeMoney ?? TIER_PRIZE[tier],
    presentedBy: curated?.presentedBy ?? sponsor,
    // Venue scenes for main-tour cards, action shots for the smaller
    // Challenger/international treatments (see docs/VENUE-ASSETS.md).
    image:
      curated?.image ??
      (!isChallenger && isUsOrg
        ? VENUE_IMAGES[index % VENUE_IMAGES.length]
        : GENERIC_IMAGES[index % GENERIC_IMAGES.length]),
    gallery: curated?.gallery,
    brand: curated?.brand,
    region: isUsOrg ? undefined : "international",
    country: isUsOrg ? undefined : inferCountry(t.organization_name, t.venue_country),
    season: status === "completed" ? inferSeason(startDate) : undefined,
    tournamentUuid: t.tournament_uuid,
    externalUrl: t.details_url || undefined,
    // US main-tour + curated events get a rich internal page; challengers and
    // international sister-tour stops link out to their details_url instead.
    hasInternalPage: !isChallenger && (isUsOrg || Boolean(curated)),
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
