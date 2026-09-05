import { getAthlete } from "@/lib/athletes";
import wprSnapshot from "@/lib/data/wpr-snapshot.json";
import { RANKINGS_CACHE_TAG } from "@/lib/cache-tags";
import { type Division, type DivisionKey, divisionRankings } from "@/lib/home-content";
import { pbGetJson } from "@/lib/pb-fetch";
import { CURATED_TO_CANONICAL, getPublishedAthlete } from "@/lib/published-athletes";
import {
  isFiltering,
  matchesPlayerName,
  playerRegion,
  type RegionFilter,
} from "@/lib/ranking-filters";

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
 *   2. A durable 24h cache of the RESULT, tagged {@link RANKINGS_CACHE_TAG} —
 *      across requests, builds and deploys. It caches the assembled value
 *      rather than the `fetch`, so a page that only succeeded on a RETRY still
 *      persists; see {@link fetchBoardPage} for why that distinction is what
 *      makes a rate limit recoverable instead of self-sustaining.
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
/**
 * Rows per page on the full standings — /leaderboards AND the paginated board
 * on /rankings. ⚠ Keep it one constant: the two pages show the same boards, and
 * "page 7" meaning different rows depending on which one you are looking at is
 * the kind of drift this repo keeps paying for.
 */
export const FULL_PAGE_SIZE = 50;
/** Cache the upstream response for a day; the `rank=<today>` param also rolls it. */
const REVALIDATE_SECONDS = 60 * 60 * 24;
/**
 * The ONE page size every upstream board request uses, so all consumers share a
 * cache entry. Deep enough to cover the 150-row scans the per-athlete lookups
 * used to make on their own.
 *
 * It is also a multiple of {@link FULL_PAGE_SIZE}, which used to be load-bearing
 * (a 50-row display page never straddled two upstream pages). It no longer is —
 * {@link getRankingPage} paginates the assembled board, not a single upstream
 * page — but keeping the relationship costs nothing.
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

/**
 * The fields the standings table actually renders — the wire shape for the
 * complete boards.
 *
 * ⚠ THIS IS A PAYLOAD TYPE, NOT A CONVENIENCE. /rankings no longer ships ~2,000
 * rows of HTML; it seeds the top {@link TOP_COUNT} of each board and fetches the
 * rest from /api/rankings after load. That response carries every ranked pro, so
 * a field nobody renders is paid for ~2,000 times. `eventsPlayed`, `country` and
 * `image` are all dead weight there — `image` in particular is a second copy of
 * a CDN URL we already have in `headshot`.
 *
 * A {@link RankingEntry} satisfies this structurally, so every existing
 * server-rendered caller keeps working unchanged; only the wire is slimmed, by
 * {@link toBoardDivisions}.
 */
export type BoardEntry = Pick<
  RankingEntry,
  | "rank"
  | "isTied"
  | "slug"
  | "name"
  | "points"
  | "prizeMoney"
  | "countryCode"
  | "headshot"
  | "profileUrl"
  | "hasLocalProfile"
>;

export type BoardDivision = {
  key: string;
  label: string;
  short: string;
  entries: BoardEntry[];
};

/** Strip a full board down to {@link BoardEntry} for the wire. */
export function toBoardDivisions(divisions: RankingDivision[]): BoardDivision[] {
  return divisions.map((d) => ({
    key: d.key,
    label: d.label,
    short: d.short,
    entries: d.entries.map((e) => ({
      rank: e.rank,
      isTied: e.isTied,
      slug: e.slug,
      name: e.name,
      points: e.points,
      prizeMoney: e.prizeMoney,
      countryCode: e.countryCode,
      headshot: e.headshot,
      profileUrl: e.profileUrl,
      hasLocalProfile: e.hasLocalProfile,
    })),
  }));
}

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
  /** Rows in the CURRENT result set — the match count when filtering. */
  total: number;
  totalPages: number;
  /** Rows on the unfiltered board, so the page can say "12 of 1,324". */
  boardTotal: number;
  /** Whether a name/region filter narrowed this result. */
  filtered: boolean;
  source: "live" | "fallback" | "unavailable";
};

/** Name search + region filter for a board. Both optional; both narrow. */
export type RankingQuery = { q?: string; region?: RegionFilter };

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

/**
 * The on-disk board snapshot (`scripts/snapshot-rankings.mjs`).
 *
 * ⚠ THIS IS WHAT MAKES A PAGE VIEW COST ZERO RANKING CALLS, AND IT IS WHY EVERY
 * ATHLETE CAN PRERENDER (9/5). The three lookups above all need the WHOLE board
 * — correctly, since 9/4, or 17 profiles ranked 251+ render a blank rank — and
 * the whole board is up to six upstream pages for men and four for women. Once
 * a day that is nothing. Per render it was 6.1K `partner_rankings` calls in an
 * hour from `/athletes/[slug]` alone, pages taking 17-30s and never caching.
 *
 * It broke the BUILD too, which is the half that made it self-sustaining:
 * `next build` fans out over 29 worker processes, each with its own module
 * cache, all paging the same boards against an API that was throttling them.
 * The tail of the build crawled at roughly a minute a page and only 132 of 203
 * athletes came out prerendered — the other 71, Ben Johns and Anna Leigh Waters
 * among them, fell back to rendering on every request, which kept us throttled,
 * which made the next build worse.
 *
 * ⚠ IT EXPIRES, DELIBERATELY. Past {@link SNAPSHOT_MAX_AGE_MS} we fall through
 * to the live API rather than serve ranks of unknown age. A refresh job that
 * quietly stops must not freeze the standings indefinitely — it should cost us
 * calls again and show up, which is the failure we can see.
 */
const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function snapshotBoard(gender: "M" | "F"): { total: number; players: ApiPlayer[] } | null {
  const snap = wprSnapshot as {
    generatedAt?: string;
    boards?: Record<string, { total: number; players: ApiPlayer[] }>;
  };
  const board = snap.boards?.[gender];
  if (!board || !Array.isArray(board.players) || board.players.length === 0) return null;
  const age = Date.now() - Date.parse(snap.generatedAt ?? "");
  if (!Number.isFinite(age) || age > SNAPSHOT_MAX_AGE_MS) return null;
  return board;
}

/**
 * Can we answer a board question at all? A token OR a usable snapshot will do.
 *
 * ⚠ THE SNAPSHOT ALONE IS ENOUGH, AND THAT MATTERS FOR THE BUILD. Every public
 * entry point below used to open with a bare token check and bail to the
 * placeholder rows, so a build or a preview without `PB_API_TOKEN` published
 * demo standings. With a snapshot committed, those environments now serve the
 * real board and make no request to do it.
 */
function hasBoardSource(): boolean {
  return Boolean(config().token) || snapshotBoard("M") !== null || snapshotBoard("F") !== null;
}

/** One {@link BOARD_PAGE_SIZE}-row page of one gender board. */
type Board = { entries: RankingEntry[]; total: number };

const boardCache = new Map<string, { value: Board; expires: number }>();
const boardInFlight = new Map<string, Promise<Board | null>>();

/** UTC day stamp — the boards roll over on their own at midnight. */
const boardDay = () => new Date().toISOString().slice(0, 10);

/**
 * Retries for a board page. Deliberately lower than {@link pbGetJson}'s default
 * of 4: {@link boardAll} walks up to {@link MAX_BOARD_PAGES} pages, so a cold
 * board against a throttled API multiplies by every page — at the default that
 * is up to fifty upstream calls from a single render, which is a way of
 * ATTACKING a rate limit rather than backing off from it.
 */
const BOARD_RETRIES = 2;

/**
 * The upstream fetch for one board page.
 *
 * ⚠ THE DURABLE LAYER IS `pbGetJson`'s OWN Next Data Cache ENTRY, AND IT STAYS
 * THAT WAY. On 9/5 this briefly wrapped the call in `unstable_cache` instead, to
 * fix a real but narrower problem: `pbGetJson` retries with `cache: "no-store"`,
 * which does not WRITE, so a page that only succeeded on a RETRY cached nothing.
 * Caching the assembled result rather than the fetch would have persisted it.
 *
 * That was reverted the same day, and the reason is worth keeping. Next's own
 * docs scope `unstable_cache` to non-`fetch` work — database queries and async
 * functions — and wrapping a `fetch` in it meant the inner call ran `no-store`
 * on every attempt, so the ONLY thing standing between us and an upstream
 * request was that outer layer persisting. It did not visibly do so on Vercel:
 * `partner_rankings` went to ~1.7K calls in fifteen minutes, which is the shape
 * of "every render re-pages the whole board" — roughly ten calls per athlete
 * page, news article, /athletes and /europe render, instead of ten per DAY.
 *
 * The fetch-level Data Cache is the mechanism that demonstrably held this
 * endpoint for months. Do not replace it with a cleverer one during an
 * incident. The retry-does-not-persist problem is real and still open, but it
 * only bites while we are ALREADY being throttled, and it is a far smaller
 * problem than the one trading it away created.
 */
async function fetchBoardPage(gender: "M" | "F", page: number): Promise<Board | null> {
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
    rank: boardDay(),
  });

  const json = (await pbGetJson(
    `${baseUrl}/v2/data/partner_rankings?${params}`,
    { "PB-API-TOKEN": token },
    {
      timeoutMs: TIMEOUT_MS,
      retries: BOARD_RETRIES,
      revalidate: REVALIDATE_SECONDS,
      tags: [RANKINGS_CACHE_TAG],
    },
  )) as { total_records?: number; results?: { player_rankings?: ApiPlayer[] } } | null;
  if (!json) return null;

  const players = json.results?.player_rankings ?? [];
  // Always drop zero-point players (matches the source handler).
  const entries = players.filter((pl) => (pl.points ?? 0) > 0).map(mapPlayer);
  return { entries, total: json.total_records ?? entries.length };
}
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
    // ⚠ SNAPSHOT FIRST — this is the whole point of the file on disk. A page
    // served from it costs no upstream request, which is what lets every
    // athlete prerender instead of 71 of them rendering per view.
    const snap = snapshotBoard(gender);
    if (snap) {
      const start = (page - 1) * BOARD_PAGE_SIZE;
      const slice = snap.players.slice(start, start + BOARD_PAGE_SIZE);
      const value: Board = {
        entries: slice.filter((pl) => (pl.points ?? 0) > 0).map(mapPlayer),
        total: snap.total,
      };
      if (value.entries.length > 0) {
        boardCache.set(key, { value, expires: Date.now() + BOARD_TTL_MS });
      }
      return value;
    }

    const value = await fetchBoardPage(gender, page);
    // Only memo a populated page — never pin an empty result from a transient
    // blip for six hours (the next caller retries instead).
    if (value && value.entries.length > 0) {
      boardCache.set(key, { value, expires: Date.now() + BOARD_TTL_MS });
    }
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

const fullBoardCache = new Map<string, { value: RankingEntry[]; expires: number }>();
const fullBoardInFlight = new Map<string, Promise<RankingEntry[]>>();

/**
 * Every ranked player on one gender board, paging the shared cache. A failed
 * page ends paging and we keep what we already collected (see getFullRankings).
 *
 * ⚠ MEMOIZED AND IN-FLIGHT-COLLAPSED AS A WHOLE BOARD, not merely per page.
 * Since 9/4 this is what the athlete pages, the /athletes grid, /europe and
 * every news article's player rail read — it fixed 17 profiles that rendered a
 * blank rank because they sit past the top 250 — which also made it the site's
 * hottest upstream path. One uncollapsed call walks up to
 * {@link MAX_BOARD_PAGES} pages, so without this, concurrent renders on one
 * instance each re-walk the board and interleave between the per-page awaits.
 */
async function boardAll(gender: "M" | "F"): Promise<RankingEntry[]> {
  const key = `${gender}:${boardDay()}`;
  const hit = fullBoardCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = fullBoardInFlight.get(key);
  if (pending) return pending;

  const p = (async (): Promise<RankingEntry[]> => {
    // ⚠ SNAPSHOT FIRST, for the same reason boardPage does it — and here it
    // replaces up to MAX_BOARD_PAGES sequential upstream calls with one pass
    // over an array. Mapping ~2,300 players is not free, so it stays inside the
    // memo below rather than being redone per caller.
    const snap = snapshotBoard(gender);
    if (snap) {
      const mapped = snap.players.filter((pl) => (pl.points ?? 0) > 0).map(mapPlayer);
      if (mapped.length > 0) {
        fullBoardCache.set(key, { value: mapped, expires: Date.now() + BOARD_TTL_MS });
      }
      return mapped;
    }

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
    // Only memo a board we actually assembled in full — never pin a partial or
    // empty result from a blip, for the same reason boardPage does not.
    if (all.length > 0 && all.length >= total) {
      fullBoardCache.set(key, { value: all, expires: Date.now() + BOARD_TTL_MS });
    }
    return all;
  })();

  fullBoardInFlight.set(key, p);
  try {
    return await p;
  } finally {
    fullBoardInFlight.delete(key);
  }
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
    page, pageSize, total: 0, totalPages: 0, boardTotal: 0, filtered: false,
    source: "unavailable",
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

function fallbackPage(
  g: GenderQuery,
  page: number,
  pageSize: number,
  query: RankingQuery = {},
): RankingPage {
  const all = fallbackEntries(g.key);
  const entries = filterEntries(all, query);
  return {
    gender: g.key,
    label: g.label,
    entries,
    page,
    pageSize,
    total: entries.length,
    totalPages: 1,
    boardTotal: all.length,
    filtered: isFiltering(query.q ?? "", query.region ?? "all"),
    source: "fallback",
  };
}

/**
 * Apply the name search and region filter. Shared with the client board via
 * lib/ranking-filters, so /rankings and /leaderboards agree on what matches.
 *
 * ⚠ Region is derived from `countryCode`, which the placeholder fallback rows
 * do NOT carry — so in local dev without a PB_API_TOKEN every fallback player
 * reads as "Rest of World". That's cosmetic (the fallback is 8 invented rows
 * and must never ship to production) but don't verify the region filter against
 * it; verify against live data.
 */
function filterEntries(entries: RankingEntry[], query: RankingQuery): RankingEntry[] {
  const q = (query.q ?? "").trim();
  const region = query.region ?? "all";
  if (!isFiltering(q, region)) return entries;
  return entries.filter(
    (e) =>
      matchesPlayerName(e.name, q) &&
      (region === "all" || playerRegion(e.countryCode) === region),
  );
}

/**
 * Top rows of both gender boards. Safe to call from server components; never
 * throws — returns the placeholder fallback on error.
 *
 * `count` costs nothing to raise up to {@link BOARD_PAGE_SIZE}: every value
 * slices the same cached page-1 response, so asking for 50 makes no extra
 * upstream request. /rankings asks for {@link FULL_PAGE_SIZE} so its first
 * paginated page is complete in the HTML; the homepage and /athletes modules
 * take the {@link TOP_COUNT} default.
 */
export async function getRankings(count: number = TOP_COUNT): Promise<RankingsResult> {
  if (!hasBoardSource()) return fallbackResult();

  /* One board failing must not take the other down with it, and NEITHER may be
     replaced by the demo data — see the note on RankingsResult.source. */
  const divisions = await Promise.all(
    RANKING_GENDERS.map(async (g) => {
      const entries = (await boardTop(g.gender, count)) ?? [];
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
  if (!hasBoardSource()) return fallbackResult();

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
 * One paginated page of a single gender board for /leaderboards, optionally
 * narrowed by name search and/or region. `page` is 1-indexed. Never throws —
 * returns the placeholder fallback on error.
 *
 * ⚠ IT READS THE WHOLE BOARD, AND BOTH REASONS MATTER.
 *
 * 1. A name search has to be able to reach No. 1,300. Filtering the 50 rows
 *    this page happens to be showing would only ever find someone you had
 *    already scrolled to, which is the entire problem search exists to solve.
 *
 * 2. THE UNFILTERED TOTAL WAS WRONG, AND VISIBLY SO. This used to slice a
 *    single cached {@link BOARD_PAGE_SIZE}-row page and report the API's
 *    `total_records` as the total — but the mapper drops zero-point players
 *    (42 of them on the men's board), so /leaderboards advertised **1,366
 *    players and 28 pages when the board ends at 1,324 on page 27**. Page 28
 *    rendered "No players on this page" in the tour's own standings. Adding the
 *    filtered path is what surfaced it: the two code paths sat on the same
 *    screen quoting different totals for the same board. Both now count only
 *    rows that actually render.
 *
 * The cost of reading all of it is ~nothing: {@link boardAll} pages the shared
 * Data Cache (24h, tagged) that /rankings — force-static, so built at deploy —
 * has already populated for both genders, plus the module memo in front of it.
 * Same number of upstream calls per day either way, because /rankings needs
 * every page regardless.
 */
export async function getRankingPage(
  genderKey: string,
  page: number,
  query: RankingQuery = {},
): Promise<RankingPage> {
  const g = RANKING_GENDERS.find((x) => x.key === genderKey) ?? RANKING_GENDERS[0];
  const requested = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  if (!hasBoardSource()) return fallbackPage(g, requested, FULL_PAGE_SIZE, query);

  const all = await boardAll(g.gender);
  // Configured but the call failed — say so, never print the demo rows.
  if (all.length === 0) return unavailablePage(g, requested, FULL_PAGE_SIZE);

  const rows = filterEntries(all, query);
  const totalPages = Math.max(1, Math.ceil(rows.length / FULL_PAGE_SIZE));
  // ⚠ Clamp, don't trust. Searching from page 27 would otherwise land on page 27
  // of 1 and read empty for a query that actually matched.
  const safePage = Math.min(requested, totalPages);
  const from = (safePage - 1) * FULL_PAGE_SIZE;

  return {
    gender: g.key,
    label: g.label,
    entries: rows.slice(from, from + FULL_PAGE_SIZE),
    page: safePage,
    pageSize: FULL_PAGE_SIZE,
    total: rows.length,
    totalPages,
    boardTotal: all.length,
    filtered: isFiltering(query.q ?? "", query.region ?? "all"),
    source: "live",
  };
}

/**
 * How many players on the OTHER gender board match this query. Lets
 * /leaderboards turn a zero-result page into "3 matches in Women's →" instead
 * of a dead end — searching "waters" while sitting on the men's board is the
 * single most likely way to get nothing back.
 *
 * Called only when the current board has no matches, so the common path still
 * reads one board. Reads the shared cache, so it makes no upstream request of
 * its own once /rankings or the other board has warmed it.
 */
export async function countRankingMatches(
  genderKey: string,
  query: RankingQuery,
): Promise<number> {
  const g = RANKING_GENDERS.find((x) => x.key === genderKey);
  if (!g || !hasBoardSource()) return 0;
  if (!isFiltering(query.q ?? "", query.region ?? "all")) return 0;
  return filterEntries(await boardAll(g.gender), query).length;
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
 *
 * ⚠ WHOLE BOARD, NOT PAGE 1 — fixed 9/4 with {@link getWprPlayerBySlug}, which
 * carries the full note. This one decides the rank badge on the "More Pros"
 * rail and on every news article's "Players in This Story" rail, so leaving it
 * capped at the top {@link BOARD_PAGE_SIZE} would have shown a pro's rank on
 * their own profile and a blank beside their face two sections away.
 */
export async function getRankingBySlug(): Promise<Record<string, AthleteRanking>> {
  if (!hasBoardSource()) return {};

  const out: Record<string, AthleteRanking> = {};
  for (const g of RANKING_GENDERS) {
    for (const e of await boardAll(g.gender)) {
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
  if (!hasBoardSource()) return [];

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
 * covering the WHOLE of both gender boards. Lets the full roster grid show live
 * rank/points/headshots for any published athlete who is ranked. Never throws —
 * returns {} on any problem.
 *
 * ⚠ THIS READS `boardAll`, NOT PAGE 1. It used to read only the first
 * {@link BOARD_PAGE_SIZE} rows of each board, which silently blanked the rank
 * and points of every pro ranked 251+ — see the note on
 * {@link getWprPlayerBySlug} for what that cost and why the extra pages are
 * effectively free.
 */
export async function getWprIndex(): Promise<Record<string, ApiAthlete>> {
  if (!hasBoardSource()) return {};

  const out: Record<string, ApiAthlete> = {};
  await Promise.all(
    RANKING_GENDERS.map(async (g) => {
      const entries = await boardAll(g.gender);
      const gender = g.gender === "F" ? "female" : "male";
      for (const e of entries) out[e.slug] = { ...e, gender };
    }),
  );
  return out;
}

/**
 * A single player's live WPR record by slug (accepts our curated slug or the
 * API's player_slug). Scans the WHOLE of both boards. Null if not found or on
 * any error.
 *
 * ⚠ IT USED TO SCAN ONLY PAGE 1 — THE TOP {@link BOARD_PAGE_SIZE} — AND THAT
 * WAS A REAL BUG, NOT A LIMIT. A pro ranked 251+ was simply "not found", so the
 * page fell through to `rank: 0` / `points: 0` and printed a DASH for both,
 * which reads as "unranked" when the player has real points. Reported 9/4 on
 * Karolina Owczarek — world No. 261, 51.25 points, page 2 of the women's board
 * — whose profile showed a blank WPR while pickleball.com showed her 51.
 * **Measured the same day: 17 of our 203 published profiles were blanked this
 * way**, from No. 261 down to No. 1047. Only 5 of the 203 are genuinely
 * unranked, and those still (correctly) show a dash.
 *
 * ⚠ The extra pages are effectively free, which is why this is safe to do on a
 * per-page lookup. `boardAll` is 4 pages for the women's board and 6 for the
 * men's at today's sizes; every one is memoized in-process, held in the Next
 * durable cache for 24h and tagged {@link RANKINGS_CACHE_TAG}, and `/rankings`
 * already pulls exactly these pages via `getFullRankings` — so the board is
 * usually already warm before an athlete page asks for it.
 *
 * Called once per athlete page AND again from its generateMetadata, so it must
 * cost nothing beyond the shared board — hence no request of its own.
 */
export async function getWprPlayerBySlug(slug: string): Promise<ApiAthlete | null> {
  if (!hasBoardSource()) return null;

  const target = SLUG_ALIAS[slug] ?? slug;
  for (const g of RANKING_GENDERS) {
    const entries = await boardAll(g.gender);
    const found = entries.find((e) => e.slug === target);
    if (found) return { ...found, gender: g.gender === "F" ? "female" : "male" };
  }
  return null;
}
