import { getAthlete } from "@/lib/athletes";
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";
import { type Division, type DivisionKey, divisionRankings } from "@/lib/home-content";
import { pbGetJson } from "@/lib/pb-fetch";
import { CURATED_TO_CANONICAL, getPublishedAthlete } from "@/lib/published-athletes";

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
 *
 * CACHING (7/31 — we were being throttled on this endpoint). Every consumer in
 * this file reads through {@link boardPage}, which layers three things:
 *
 *   1. `pbGetJson` — retry with backoff, so a 429 is absorbed instead of
 *      collapsing the board to "unavailable" on the first throttle.
 *   2. Next Data Cache, 24h, tagged {@link ATHLETES_CACHE_TAG} — durable across
 *      requests, builds and deploys, refreshed by the daily
 *      /api/revalidate-athletes cron.
 *   3. A module-scope memo + in-flight map — collapses the parallel page
 *      renders of one build (or one warm instance) into a single upstream call,
 *      which the Data Cache alone can't do while it's still cold.
 *
 * And critically, ONE page size for all of them: this file used to ask for 25,
 * 50, 100 and 150 rows of the same board, so each variant was its own cache
 * entry and its own upstream request. Everything now derives from
 * {@link BOARD_PAGE_SIZE}-row pages, so the whole site shares two URLs (one per
 * gender) instead of eight.
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
/**
 * The ONE page size every upstream board request uses, so all consumers share a
 * cache entry. Chosen so that it is a multiple of {@link FULL_PAGE_SIZE} (a
 * 50-row display page never straddles two upstream pages) and deep enough to
 * cover the 150-row scans the per-athlete lookups used to make on their own.
 */
const BOARD_PAGE_SIZE = 250;
/** Runaway guard when paging the full board. */
const MAX_BOARD_PAGES = 10;
const TIMEOUT_MS = 8000;
/** In-process memo lifetime. The Data Cache behind it is the durable layer. */
const BOARD_TTL_MS = 6 * 60 * 60 * 1000;

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
  /** Raw API cutout (transparent PNG), independent of any curated override. */
  image: string | null;
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
  /**
   * "live"        — real API data.
   * "fallback"    — the demo placeholder. ONLY legitimate with no PB_API_TOKEN,
   *                 i.e. local dev. Never serve it in production: these are
   *                 invented point totals and they look completely plausible.
   * "unavailable" — we are configured but the API failed. The page must say so
   *                 rather than print numbers we made up (7/29: /rankings was
   *                 publishing the 8-row demo set as though it were the board —
   *                 Fed at 9,840 when he is really on 10,895 — and three people
   *                 reported it as "the rankings are wrong" without anyone
   *                 realising the data was fictional).
   */
  source: "live" | "fallback" | "unavailable";
};

export type RankingPage = {
  gender: string;
  label: string;
  entries: RankingEntry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  source: "live" | "fallback" | "unavailable";
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
  // We also host a page for every published athlete (bio + quick facts).
  const published = getPublishedAthlete(slug);
  if (published) {
    return { url: `/athletes/${published.slug}`, local: true, headshot: null };
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
    image: p.profile_image || null,
    profileUrl: url,
    hasLocalProfile: local,
  };
}

/** One {@link BOARD_PAGE_SIZE}-row page of one gender board. */
type Board = { entries: RankingEntry[]; total: number };

const boardCache = new Map<string, { value: Board; expires: number }>();
const boardInFlight = new Map<string, Promise<Board | null>>();

/**
 * One page of one gender board, cached three ways (see the file header). Null
 * means the call genuinely failed — callers must distinguish that from a page
 * that legitimately came back empty, since we never print the demo rows in
 * place of live data.
 */
async function boardPage(gender: "M" | "F", page: number): Promise<Board | null> {
  const key = `${gender}:${page}`;
  const hit = boardCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  // Collapse concurrent callers (parallel page renders in a build) into one call.
  const pending = boardInFlight.get(key);
  if (pending) return pending;

  const p = (async (): Promise<Board | null> => {
    const { token, baseUrl } = config();
    if (!token) return null;
    const params = new URLSearchParams({
      partner: "ppa",
      division_type: String(WORLD_DIVISION_TYPE),
      gender,
      race: String(RACE),
      is_live: "false",
      bracket_level_id: String(PRO_BRACKET),
      current_page: String(page),
      page_size: String(BOARD_PAGE_SIZE),
      // Day-scoped key: rolls the cache over at midnight UTC on its own.
      rank: new Date().toISOString().slice(0, 10),
    });

    const json = (await pbGetJson(
      `${baseUrl}/v2/data/partner_rankings?${params}`,
      { "PB-API-TOKEN": token },
      { timeoutMs: TIMEOUT_MS, revalidate: REVALIDATE_SECONDS, tags: [ATHLETES_CACHE_TAG] },
    )) as { total_records?: number; results?: { player_rankings?: ApiPlayer[] } } | null;
    if (!json) return null;

    const players = json.results?.player_rankings ?? [];
    // Always drop zero-point players (matches the source handler).
    const entries = players.filter((pl) => (pl.points ?? 0) > 0).map(mapPlayer);
    const value: Board = { entries, total: json.total_records ?? entries.length };
    // Only memo a populated page — never pin an empty result from a transient
    // blip for six hours (the next caller retries instead).
    if (entries.length > 0) boardCache.set(key, { value, expires: Date.now() + BOARD_TTL_MS });
    return value;
  })();

  boardInFlight.set(key, p);
  try {
    return await p;
  } finally {
    boardInFlight.delete(key);
  }
}

/** The top rows of one gender board, from the shared cached page 1. */
async function boardTop(gender: "M" | "F", count: number): Promise<RankingEntry[] | null> {
  const board = await boardPage(gender, 1);
  return board ? board.entries.slice(0, count) : null;
}

/**
 * Every ranked player on one gender board, paging the shared cache. A failed
 * page ends paging and we keep what we already collected (see getFullRankings).
 */
async function boardAll(gender: "M" | "F"): Promise<RankingEntry[]> {
  const all: RankingEntry[] = [];
  let page = 1;
  let total = Infinity;
  while (all.length < total && page <= MAX_BOARD_PAGES) {
    const got = await boardPage(gender, page);
    if (!got || got.entries.length === 0) break;
    all.push(...got.entries);
    total = got.total;
    page += 1;
  }
  return all;
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
      image: null,
      profileUrl: url,
      hasLocalProfile: local,
    };
  });
}

/** Configured but the API failed: no rows, and the page says so. */
function unavailableResult(): RankingsResult {
  return {
    divisions: RANKING_GENDERS.map((g) => ({
      key: g.key, label: g.label, short: g.short, entries: [],
    })),
    source: "unavailable",
  };
}
function unavailablePage(g: GenderQuery, page: number, pageSize: number): RankingPage {
  return {
    gender: g.key, label: g.label, entries: [],
    page, pageSize, total: 0, totalPages: 0, source: "unavailable",
  };
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
  if (!config().token) return fallbackResult();

  /* One board failing must not take the other down with it, and NEITHER may be
     replaced by the demo data — see the note on RankingsResult.source. */
  const divisions = await Promise.all(
    RANKING_GENDERS.map(async (g) => {
      const entries = (await boardTop(g.gender, TOP_COUNT)) ?? [];
      return { key: g.key, label: g.label, short: g.short, entries };
    }),
  );
  if (divisions.every((d) => d.entries.length === 0)) return unavailableResult();
  return { divisions, source: "live" };
}

/**
 * The COMPLETE ranking boards — every ranked pro, both genders, no cap
 * (Connor's "all the way" ask for /rankings). Pages the shared board cache
 * until the reported total is exhausted. Never throws — placeholder fallback
 * when unconfigured.
 *
 * THE BUG THIS PRESERVES A FIX FOR (7/29): a single failed page used to throw
 * out of the loop, the outer catch swallowed it, and the whole board was
 * replaced by the demo data — so a partial outage silently became 16 rows of
 * invented points on the tour's own rankings page. A failed page still just
 * ends that gender's paging and we serve what we already collected; only a
 * total wipeout reports unavailable.
 */
export async function getFullRankings(): Promise<RankingsResult> {
  if (!config().token) return fallbackResult();

  const divisions = await Promise.all(
    RANKING_GENDERS.map(async (g) => ({
      key: g.key,
      label: g.label,
      short: g.short,
      entries: await boardAll(g.gender),
    })),
  );
  if (divisions.every((d) => d.entries.length === 0)) return unavailableResult();
  return { divisions, source: "live" };
}

/**
 * One paginated page of a single gender board for the full /leaderboards page.
 * `page` is 1-indexed. Never throws — returns the placeholder fallback on error.
 *
 * Served by slicing a shared {@link BOARD_PAGE_SIZE}-row page rather than asking
 * upstream for 50 rows: paging /leaderboards costs no extra upstream calls
 * within a block of five display pages, and the rows come from the same cache
 * entry /rankings and the athlete pages already populated. BOARD_PAGE_SIZE is a
 * multiple of FULL_PAGE_SIZE, so a display page never straddles two of them.
 */
export async function getRankingPage(genderKey: string, page: number): Promise<RankingPage> {
  const g = RANKING_GENDERS.find((x) => x.key === genderKey) ?? RANKING_GENDERS[0];
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  if (!config().token) return fallbackPage(g, safePage, FULL_PAGE_SIZE);

  const offset = (safePage - 1) * FULL_PAGE_SIZE;
  const board = await boardPage(g.gender, Math.floor(offset / BOARD_PAGE_SIZE) + 1);
  // Configured but the call failed — say so, never print the demo rows.
  if (!board) return unavailablePage(g, safePage, FULL_PAGE_SIZE);

  const start = offset % BOARD_PAGE_SIZE;
  const entries = board.entries.slice(start, start + FULL_PAGE_SIZE);
  if (entries.length === 0 && safePage === 1) return unavailablePage(g, safePage, FULL_PAGE_SIZE);
  return {
    gender: g.key,
    label: g.label,
    entries,
    page: safePage,
    pageSize: FULL_PAGE_SIZE,
    total: board.total,
    totalPages: Math.max(1, Math.ceil(board.total / FULL_PAGE_SIZE)),
    source: "live",
  };
}

/* ---- per-athlete WPR ranking (by slug) ---- */

export type AthleteRanking = { rank: number; gender: "men" | "women"; points: number };

// Our curated athlete slugs that differ from the API's player_slug (shared
// with the published-athletes layer, which is keyed by the canonical slug).
const SLUG_ALIAS: Record<string, string> = CURATED_TO_CANONICAL;

/**
 * Live WPR ranking for every ranked player, keyed by slug (both the API's
 * player_slug and our local aliases). Lets our athlete pages show each pro's
 * current combined ranking. Never throws — returns {} on any problem.
 *
 * Called by EVERY news article page as well as the athlete pages, so it has to
 * be free after the first hit — it reads the same shared board cache the rest
 * of this file does and makes no request of its own.
 */
export async function getRankingBySlug(): Promise<Record<string, AthleteRanking>> {
  if (!config().token) return {};

  const out: Record<string, AthleteRanking> = {};
  for (const g of RANKING_GENDERS) {
    const board = await boardPage(g.gender, 1);
    for (const e of board?.entries ?? []) {
      if (e.slug && e.rank > 0) {
        out[e.slug] = { rank: e.rank, gender: g.key as "men" | "women", points: e.points };
      }
    }
  }
  // Map our aliased slugs onto the API's ranking.
  for (const [ours, api] of Object.entries(SLUG_ALIAS)) {
    if (out[api]) out[ours] = out[api];
  }
  return out;
}

/* ---- API-driven athlete roster (top 25 Men + top 25 Women) ---- */

/** One athlete in the WPR-driven roster — a ranking entry plus its board gender. */
export type ApiAthlete = RankingEntry & { gender: "male" | "female" };

// API player_slug -> our curated slug, so grid cards/profiles reuse the rich
// (bio-bearing) curated page when we have one.
const REVERSE_ALIAS: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_ALIAS).map(([ours, api]) => [api, ours]),
);

/**
 * The curated /athletes/[slug] to link to for an API player, or null when we
 * have no curated profile (the API slug is used, and the profile page renders
 * from live data). Handles the handful of slug aliases.
 */
export function curatedSlugFor(apiSlug: string): string | null {
  if (REVERSE_ALIAS[apiSlug]) return REVERSE_ALIAS[apiSlug];
  return getAthlete(apiSlug) ? apiSlug : null;
}

/**
 * The athlete roster grid: the top {@link TOP_COUNT} of each gender's World
 * Pickleball Ranking, straight from the API. Never throws — returns [] on any
 * problem so the page can fall back to the curated roster.
 */
export async function getWprRoster(): Promise<ApiAthlete[]> {
  if (!config().token) return [];

  const boards = await Promise.all(
    RANKING_GENDERS.map(async (g) => {
      const entries = (await boardTop(g.gender, TOP_COUNT)) ?? [];
      const gender = g.gender === "F" ? "female" : "male";
      return entries.map((e): ApiAthlete => ({ ...e, gender }));
    }),
  );
  return boards.flat();
}

/**
 * Live WPR record for every ranked player, keyed by the API `player_slug`,
 * covering the first {@link BOARD_PAGE_SIZE} of each gender board. Lets the full
 * roster grid show live rank/points/headshots for any published athlete who is
 * ranked. Never throws — returns {} on any problem.
 */
export async function getWprIndex(): Promise<Record<string, ApiAthlete>> {
  if (!config().token) return {};

  const out: Record<string, ApiAthlete> = {};
  await Promise.all(
    RANKING_GENDERS.map(async (g) => {
      const board = await boardPage(g.gender, 1);
      const gender = g.gender === "F" ? "female" : "male";
      for (const e of board?.entries ?? []) out[e.slug] = { ...e, gender };
    }),
  );
  return out;
}

/**
 * A single player's live WPR record by slug (accepts our curated slug or the
 * API's player_slug). Scans the first {@link BOARD_PAGE_SIZE} of both boards.
 * Null if not found or on any error.
 *
 * Called once per athlete page AND again from its generateMetadata, so it must
 * cost nothing beyond the shared board — hence no request of its own.
 */
export async function getWprPlayerBySlug(slug: string): Promise<ApiAthlete | null> {
  if (!config().token) return null;

  const target = SLUG_ALIAS[slug] ?? slug;
  for (const g of RANKING_GENDERS) {
    const board = await boardPage(g.gender, 1);
    const found = board?.entries.find((e) => e.slug === target);
    if (found) return { ...found, gender: g.gender === "F" ? "female" : "male" };
  }
  return null;
}
