import { getAthlete } from "@/lib/athletes";
import { type Division, type DivisionKey, divisionRankings } from "@/lib/home-content";

/**
 * Live rankings adapter — Pickleball.com Partner API.
 *
 * Mirrors the WordPress `get_rankings_handler` server-side so the token never
 * reaches the browser: assembles the query, filters zero-point players, maps
 * each result into our shape, and resolves a local athlete profile when we
 * have one (falling back to pickleball.com). Falls back to the hand-authored
 * `divisionRankings` placeholder if the API is unconfigured, errors, or empty.
 *
 *   GET {base}/v2/data/partner_rankings
 *   header  PB-API-TOKEN: <token>
 *   params  partner=ppa, division_type, gender, race, is_live=false,
 *           bracket_level_id=2 (pro), rank=<today>, current_page, page_size
 *
 * World Pickleball Rankings: a single combined ranking (division_type 8,
 * verified against live data, bracket_level_id=2) split only by gender —
 * no singles/doubles/mixed breakdown. Points aggregate across every
 * discipline; the rolling 52-week ranking (race=false) is what we display.
 */

const PRO_BRACKET = 2;
const WORLD_DIVISION_TYPE = 8;
/** 52-week rolling ranking (the Race to Championship view is race=true). */
const RACE = false;
/** Rows shown in the /rankings preview. */
export const TOP_COUNT = 25;
/** Rows per page on the full /leaderboards page. */
export const FULL_PAGE_SIZE = 50;
/** Cache the upstream response for a day; the `rank=<today>` param also rolls it. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

type GenderQuery = { key: string; label: string; short: string; gender: "M" | "F" };

/** The two boards: Men and Women. */
export const RANKING_GENDERS: GenderQuery[] = [
  { key: "men", label: "Men", short: "Men", gender: "M" },
  { key: "women", label: "Women", short: "Women", gender: "F" },
];

export type RankingEntry = {
  rank: number;
  isTied: boolean;
  slug: string;
  name: string;
  points: number;
  eventsPlayed: number;
  prizeMoney: number;
  country: string;
  /** Lowercase 2-letter code for the circle-flag CDN, or "" if unknown. */
  countryCode: string;
  /** Local headshot or remote profile image; null renders an initials chip. */
  headshot: string | null;
  /** Internal /athletes/[slug] when we have the profile, else pickleball.com. */
  profileUrl: string;
  hasLocalProfile: boolean;
};

export type RankingDivision = {
  key: string;
  label: string;
  short: string;
  entries: RankingEntry[];
};

export type RankingsResult = {
  divisions: RankingDivision[];
  /** "live" from the API, or "fallback" to the placeholder data. */
  source: "live" | "fallback";
};

export type RankingPage = {
  gender: string;
  label: string;
  entries: RankingEntry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  source: "live" | "fallback";
};

/** Shape of one entry in results.player_rankings we rely on. */
type ApiPlayer = {
  ranking: string;
  is_tied?: boolean;
  player_slug: string;
  player_full_name: string;
  points: number;
  total_events_played?: number;
  prize_money?: number;
  country?: string;
  player_country_two_digit_abbreviation?: string;
  profile_image?: string;
};

function config() {
  const token = process.env.PB_API_TOKEN;
  const baseUrl = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, baseUrl };
}

function resolveProfile(slug: string): { url: string; local: boolean; headshot: string | null } {
  const athlete = getAthlete(slug);
  if (athlete) {
    return { url: `/athletes/${athlete.slug}`, local: true, headshot: athlete.headshot };
  }
  return { url: `https://pickleball.com/players/${slug}`, local: false, headshot: null };
}

function mapPlayer(p: ApiPlayer): RankingEntry {
  const { url, local, headshot } = resolveProfile(p.player_slug);
  return {
    rank: Number.parseInt(p.ranking, 10) || 0,
    isTied: Boolean(p.is_tied),
    slug: p.player_slug,
    name: p.player_full_name,
    points: p.points ?? 0,
    eventsPlayed: p.total_events_played ?? 0,
    prizeMoney: p.prize_money ?? 0,
    country: p.country ?? "",
    countryCode: (p.player_country_two_digit_abbreviation ?? "").toLowerCase(),
    headshot: headshot ?? (p.profile_image || null),
    profileUrl: url,
    hasLocalProfile: local,
  };
}

/** Fetch one page of one gender board; returns mapped entries + the API total. */
async function fetchPage(
  gender: "M" | "F",
  page: number,
  pageSize: number,
  token: string,
  baseUrl: string,
  today: string,
): Promise<{ entries: RankingEntry[]; total: number }> {
  const params = new URLSearchParams({
    partner: "ppa",
    division_type: String(WORLD_DIVISION_TYPE),
    gender,
    race: String(RACE),
    is_live: "false",
    bracket_level_id: String(PRO_BRACKET),
    current_page: String(page),
    page_size: String(pageSize),
    rank: today,
  });

  const res = await fetch(`${baseUrl}/v2/data/partner_rankings?${params}`, {
    headers: { "PB-API-TOKEN": token },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`partner_rankings ${gender} p${page} → HTTP ${res.status}`);

  const data = (await res.json()) as {
    total_records?: number;
    results?: { player_rankings?: ApiPlayer[] };
  };
  const players = data.results?.player_rankings ?? [];
  // Always drop zero-point players (matches the source handler).
  const entries = players.filter((p) => (p.points ?? 0) > 0).map(mapPlayer);
  return { entries, total: data.total_records ?? entries.length };
}

/* ---- placeholder fallbacks (API down / unconfigured) ---- */

const FALLBACK_SOURCE: Record<string, DivisionKey> = { men: "ms", women: "ws" };

function fallbackEntries(genderKey: string): RankingEntry[] {
  const src = divisionRankings.find((d) => d.key === FALLBACK_SOURCE[genderKey]) as
    | Division
    | undefined;
  return (src?.entries ?? []).map((e) => {
    const { url, local, headshot } = resolveProfile(e.slug);
    const athlete = getAthlete(e.slug);
    return {
      rank: e.rank,
      isTied: false,
      slug: e.slug,
      name: athlete?.name ?? e.slug,
      points: e.points,
      eventsPlayed: 0,
      prizeMoney: 0,
      country: athlete?.country ?? "",
      countryCode: "",
      headshot,
      profileUrl: url,
      hasLocalProfile: local,
    };
  });
}

function fallbackResult(): RankingsResult {
  const divisions = RANKING_GENDERS.map((g) => ({
    key: g.key,
    label: g.label,
    short: g.short,
    entries: fallbackEntries(g.key),
  }));
  return { divisions, source: "fallback" };
}

function fallbackPage(g: GenderQuery, page: number, pageSize: number): RankingPage {
  const entries = fallbackEntries(g.key);
  return {
    gender: g.key,
    label: g.label,
    entries,
    page,
    pageSize,
    total: entries.length,
    totalPages: 1,
    source: "fallback",
  };
}

/**
 * Top rows of both gender boards for the /rankings preview. Safe to call from
 * server components; never throws — returns the placeholder fallback on error.
 */
export async function getRankings(): Promise<RankingsResult> {
  const { token, baseUrl } = config();
  if (!token) return fallbackResult();

  const today = new Date().toISOString().slice(0, 10);
  try {
    const divisions = await Promise.all(
      RANKING_GENDERS.map(async (g) => {
        const { entries } = await fetchPage(g.gender, 1, TOP_COUNT, token, baseUrl, today);
        return { key: g.key, label: g.label, short: g.short, entries };
      }),
    );
    if (divisions.every((d) => d.entries.length === 0)) return fallbackResult();
    return { divisions, source: "live" };
  } catch {
    return fallbackResult();
  }
}

/**
 * One paginated page of a single gender board for the full /leaderboards page.
 * `page` is 1-indexed. Never throws — returns the placeholder fallback on error.
 */
export async function getRankingPage(genderKey: string, page: number): Promise<RankingPage> {
  const g = RANKING_GENDERS.find((x) => x.key === genderKey) ?? RANKING_GENDERS[0];
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const { token, baseUrl } = config();
  if (!token) return fallbackPage(g, safePage, FULL_PAGE_SIZE);

  const today = new Date().toISOString().slice(0, 10);
  try {
    const { entries, total } = await fetchPage(
      g.gender,
      safePage,
      FULL_PAGE_SIZE,
      token,
      baseUrl,
      today,
    );
    if (entries.length === 0 && safePage === 1) return fallbackPage(g, safePage, FULL_PAGE_SIZE);
    return {
      gender: g.key,
      label: g.label,
      entries,
      page: safePage,
      pageSize: FULL_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / FULL_PAGE_SIZE)),
      source: "live",
    };
  } catch {
    return fallbackPage(g, safePage, FULL_PAGE_SIZE);
  }
}
