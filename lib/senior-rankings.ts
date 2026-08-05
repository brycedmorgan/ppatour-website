/**
 * Humana Senior Open rankings — Pickleball.com Partner API.
 *
 *   GET {base}/v2/data/partner_rankings
 *   header  PB-API-TOKEN: <token>
 *   params  partner=ppa, bracket_level_id=3, division_type=1..5, gender,
 *           age_limit= (EMPTY), race=false, is_live=false, current_page, page_size
 *
 * ── THE TWO "DIVISION" PARAMS ARE DIFFERENT THINGS ───────────────────────────
 * `bracket_level_id` is the LEAGUE — 2 pro, 3 senior, 5 junior. `division_type`
 * is the DISCIPLINE, and it uses the same numbers as the pro boards. Getting a
 * senior board is `bracket_level_id=3` plus a discipline; sending only the
 * discipline silently returns the pro board, which is how you end up publishing
 * Anna Leigh Waters on a 50-and-over leaderboard. Verified they differ: senior
 * men's singles is Joshua Cooperman, pro is Christopher Haworth.
 *
 * ⚠ `age_limit` MUST BE EMPTY. It is the JUNIOR bracket control (12/14/16).
 * Senior is not an age bracket, it is an age FLOOR — 50 and over.
 *
 * ⚠ AND THE FLOOR IS NOT ENFORCED UPSTREAM, SO IT IS ENFORCED HERE. The PPA's
 * own WordPress build filters age < 50 in two places (server and client) and
 * this API is neither of them. Measured across all six boards: 6 scored players
 * carry a real age under 50 — every one of them 49, e.g. Greg Vasquez at rank 39
 * of men's singles. Without the filter they publish on a senior board.
 *
 * ⚠ 88 PLAYERS CARRY `age: "-1"` AND WE KEEP THEM. That is the one place this
 * deliberately differs from ppatour.com. Its client-side check is `age < 50`,
 * and -1 < 50, so it drops every player whose profile has no birthdate too —
 * 88 of 630 scored players, 14% of the boards, including rank 6 of women's
 * singles and rank 4 of men's mixed. -1 is "unknown", not "young": these players
 * are ON a senior board, which the tour compiles from 50-and-over draws, so a
 * blank profile field is not evidence they are ineligible. Dropping them also
 * punches visible holes in the rank sequence (1, 2, 3, 4, 5, 7, 9…).
 * {@link DROP_UNKNOWN_AGE} flips this to exact parity if that is the call.
 *
 * Caching follows lib/rankings-api.ts, for the reason recorded there — we were
 * rate-limited off this exact endpoint on 7/31, and a raw loop over these six
 * boards still 429s today (it did while this was being written). One page size,
 * Next Data Cache 24h tagged {@link ATHLETES_CACHE_TAG} so the daily
 * /api/revalidate-athletes cron refreshes it, plus a module memo and in-flight
 * map to collapse the parallel page renders of a single build into one call.
 *
 * Server-only (reads the token). Never throws.
 */
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";
import { pbGetJson } from "@/lib/pb-fetch";

/** The senior league. 2 is pro, 5 is junior. */
const SENIOR_BRACKET = 3;
/** 52-week rolling ranking. The Race view is race=true and is not shipped yet. */
const RACE = false;
/** Minimum age for the senior circuit. */
const SENIOR_MIN_AGE = 50;
/**
 * Set true to match ppatour.com exactly and drop players whose age is unknown
 * (`-1`) along with those genuinely under 50. See the header — this removes 88
 * ranked players and leaves gaps in the rank sequence.
 */
const DROP_UNKNOWN_AGE = false;

const PAGE_SIZE = 250;
/** Runaway guard. The biggest board (men's doubles) reports 259. */
const MAX_PAGES = 6;
const REVALIDATE_SECONDS = 60 * 60 * 24;
const TIMEOUT_MS = 8000;
const MEMO_TTL_MS = 6 * 60 * 60 * 1000;

export type SeniorDivision = {
  key: string;
  label: string;
  short: string;
  /** API discipline id — same numbering as the pro boards. */
  divisionType: 1 | 2 | 3 | 4 | 5;
  gender: "M" | "F";
};

/**
 * The six boards. Mixed is TWO boards, not one: `division_type=3` is filtered by
 * gender like every other discipline, so a mixed pairing appears on the men's
 * mixed board and the women's mixed board separately, each with its own ranking.
 */
export const SENIOR_DIVISIONS: SeniorDivision[] = [
  { key: "ms", label: "Men's Singles", short: "M Singles", divisionType: 2, gender: "M" },
  { key: "ws", label: "Women's Singles", short: "W Singles", divisionType: 1, gender: "F" },
  { key: "md", label: "Men's Doubles", short: "M Doubles", divisionType: 5, gender: "M" },
  { key: "wd", label: "Women's Doubles", short: "W Doubles", divisionType: 4, gender: "F" },
  { key: "mxm", label: "Mixed Doubles (Men)", short: "Mixed M", divisionType: 3, gender: "M" },
  { key: "mxw", label: "Mixed Doubles (Women)", short: "Mixed W", divisionType: 3, gender: "F" },
];

export type SeniorEntry = {
  /**
   * Stable per-player identity, and the React key the table must use.
   *
   * ⚠ NAME + RANK IS NOT UNIQUE. Women's Doubles carries TWO players called
   * "Tia Wood", tied at rank 53 on 200 points each — different people, different
   * uuids (`tia-wood` and `tia-wood-1`), one with an age and one without. Keying
   * rows on `rank-name` collided, React could not reconcile, and a stale row
   * survived into whichever board was rendered next: both mixed boards came up
   * with a phantom "53T Tia Wood" at the top and a row count one higher than
   * their own counter. Exactly the /events `key={t.slug}` bug from 8/3.
   *
   * Do NOT "fix" this by de-duplicating the two players. Same ruling as the pro
   * boards, which carry 22 duplicate names including two Ben Johns: they are
   * real, distinct people and both belong on the board.
   */
  playerUuid: string;
  rank: number;
  isTied: boolean;
  name: string;
  points: number;
  /** Null when the profile carries no birthdate (the API sends -1). */
  age: number | null;
  country: string;
  /** Lowercase 2-letter code for the circle-flag CDN, or "" if unknown. */
  countryCode: string;
  eventsPlayed: number;
};

export type SeniorBoard = {
  key: string;
  label: string;
  short: string;
  entries: SeniorEntry[];
};

export type SeniorRankingsResult = {
  boards: SeniorBoard[];
  /**
   * "live"        — real data.
   * "unavailable" — unconfigured, or the API failed. The page says so rather
   *                 than printing anything. There is deliberately NO placeholder
   *                 fallback here: /rankings shipped invented point totals for a
   *                 week in July and three people reported it as "the rankings
   *                 are wrong" before anyone realised the data was fictional.
   */
  source: "live" | "unavailable";
};

/** One entry in results.player_rankings we rely on. */
type ApiSeniorPlayer = {
  player_uuid?: string;
  player_slug?: string;
  ranking: string;
  is_tied?: boolean;
  player_full_name: string;
  points: number;
  /** String, and "-1" when unknown. */
  age?: string;
  country?: string;
  player_country_two_digit_abbreviation?: string;
  total_events_played?: number;
};

function config() {
  return {
    token: process.env.PB_API_TOKEN,
    baseUrl: (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, ""),
  };
}

/** "-1", "", undefined and junk all mean "we don't know". */
function parseAge(raw: string | undefined): number | null {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Is this player eligible to appear on a senior board? See the header. */
function isSenior(age: number | null): boolean {
  if (age === null) return !DROP_UNKNOWN_AGE;
  return age >= SENIOR_MIN_AGE;
}

function mapPlayer(p: ApiSeniorPlayer, index: number): SeniorEntry {
  return {
    // uuid, then slug, then position — so a row always has a key even if the
    // feed ever omits both identifiers.
    playerUuid: p.player_uuid || p.player_slug || `row-${index}`,
    rank: Number.parseInt(p.ranking, 10) || 0,
    isTied: Boolean(p.is_tied),
    name: p.player_full_name,
    points: p.points ?? 0,
    age: parseAge(p.age),
    country: p.country ?? "",
    countryCode: (p.player_country_two_digit_abbreviation ?? "").toLowerCase(),
    eventsPlayed: p.total_events_played ?? 0,
  };
}

type RawPage = { entries: SeniorEntry[]; total: number };

const memo = new Map<string, { value: SeniorEntry[]; expires: number }>();
const inFlight = new Map<string, Promise<SeniorEntry[] | null>>();

async function fetchPage(d: SeniorDivision, page: number): Promise<RawPage | null> {
  const { token, baseUrl } = config();
  if (!token) return null;
  const params = new URLSearchParams({
    partner: "ppa",
    division_type: String(d.divisionType),
    gender: d.gender,
    race: String(RACE),
    is_live: "false",
    bracket_level_id: String(SENIOR_BRACKET),
    // Empty on purpose — this is the junior bracket control. See the header.
    age_limit: "",
    current_page: String(page),
    page_size: String(PAGE_SIZE),
    // Day-scoped key: rolls the cache over at midnight UTC on its own.
    rank: new Date().toISOString().slice(0, 10),
  });

  const json = (await pbGetJson(
    `${baseUrl}/v2/data/partner_rankings?${params}`,
    { "PB-API-TOKEN": token },
    { timeoutMs: TIMEOUT_MS, revalidate: REVALIDATE_SECONDS, tags: [ATHLETES_CACHE_TAG] },
  )) as { total_records?: number; results?: { player_rankings?: ApiSeniorPlayer[] } } | null;
  if (!json) return null;

  const players = json.results?.player_rankings ?? [];
  const entries = players
    // Zero-point players are dropped, matching every other board on the site.
    .filter((p) => (p.points ?? 0) > 0)
    .map((p, i) => mapPlayer(p, (page - 1) * PAGE_SIZE + i))
    .filter((e) => isSenior(e.age));
  return { entries, total: json.total_records ?? entries.length };
}

/** Every ranked player on one senior board, memoised and de-duplicated. */
async function boardAll(d: SeniorDivision): Promise<SeniorEntry[] | null> {
  const hit = memo.get(d.key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = inFlight.get(d.key);
  if (pending) return pending;

  const p = (async (): Promise<SeniorEntry[] | null> => {
    const all: SeniorEntry[] = [];
    let page = 1;
    let total = Infinity;
    let fetched = 0;
    let ok = false;
    while (fetched < total && page <= MAX_PAGES) {
      const got = await fetchPage(d, page);
      // A failed FIRST page means we have nothing; a failed later page just ends
      // paging and we serve what we have, rather than losing the whole board.
      if (!got) break;
      ok = true;
      if (got.entries.length === 0 && page > 1) break;
      all.push(...got.entries);
      // Count against the reported total using RAW rows, not filtered ones —
      // paging on the filtered count would loop forever on a board where the
      // age filter drops rows.
      fetched += PAGE_SIZE;
      total = got.total;
      page += 1;
    }
    if (!ok) return null;
    if (all.length > 0) memo.set(d.key, { value: all, expires: Date.now() + MEMO_TTL_MS });
    return all;
  })();

  inFlight.set(d.key, p);
  try {
    return await p;
  } finally {
    inFlight.delete(d.key);
  }
}

/**
 * All six senior boards. Safe to call from a server component; never throws.
 * One board failing does not take the others down.
 */
export async function getSeniorRankings(): Promise<SeniorRankingsResult> {
  if (!config().token) {
    return { boards: [], source: "unavailable" };
  }

  const boards = await Promise.all(
    SENIOR_DIVISIONS.map(async (d) => ({
      key: d.key,
      label: d.label,
      short: d.short,
      entries: (await boardAll(d)) ?? [],
    })),
  );
  if (boards.every((b) => b.entries.length === 0)) {
    return { boards: [], source: "unavailable" };
  }
  return { boards, source: "live" };
}
