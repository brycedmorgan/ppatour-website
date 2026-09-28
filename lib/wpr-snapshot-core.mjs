/**
 * Assemble a World Pickleball Rankings snapshot from `partner_rankings`.
 *
 * ⚠ ONE IMPLEMENTATION, TWO CALLERS, AND THAT IS THE POINT (9/28). The build
 * step (`scripts/snapshot-rankings.mjs`) and the daily refresh
 * (`app/api/cron/rankings`) both produce the object `lib/data/wpr-snapshot.json`
 * holds. If they each built their own URLs, the two would drift — and the URL is
 * the durable-cache key, so a drift silently becomes a second set of rows. Plain
 * .mjs because a build-time `node` script cannot import TypeScript.
 *
 * It does no I/O of its own beyond `fetch`: the durable cache is injected
 * (`cache.get` / `cache.set`), and so is logging.
 */

const PAGE_SIZE = 250;
const MAX_PAGES = 10;
const PRO_BRACKET = 2;
const WORLD_DIVISION_TYPE = 8;
/** Below this a board is not credible — refuse it rather than publish it. */
export const MIN_PLAYERS = 200;

/**
 * ⚠ THE REFRESH MUST SURVIVE BEING THROTTLED, OR IT CAN NEVER BREAK THE LOOP IT
 * EXISTS TO PREVENT (9/15). Same backoff as lib/pb-fetch.ts, honouring
 * Retry-After, with more patience than a render path gets: nothing is waiting
 * on this, it runs once a day.
 */
const RETRIES = 6;
const RETRY_BASE_MS = 1000;
const RETRY_CAP_MS = 30000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function backoffMs(attempt, retryAfter) {
  const ra = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra * 1000, RETRY_CAP_MS);
  return Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_CAP_MS) + Math.floor(Math.random() * 500);
}

/** Exactly the fields `mapPlayer` in lib/rankings-api.ts reads — nothing else. */
const pick = (p) => ({
  ranking: p.ranking,
  is_tied: p.is_tied,
  player_slug: p.player_slug,
  player_full_name: p.player_full_name,
  points: p.points,
  total_events_played: p.total_events_played,
  prize_money: p.prize_money,
  country: p.country,
  player_country_two_digit_abbreviation: p.player_country_two_digit_abbreviation,
  profile_image: p.profile_image,
});

/** Only what lib/division-rankings.ts reads off a row. */
const pickDivision = (p) => ({
  player_slug: p.player_slug,
  ranking: p.ranking,
  points: p.points,
});

/**
 * The six DIVISION boards behind the athlete page's per-discipline ranks.
 * Gender doubles is 4 (women) / 5 (men); mixed is 3. Do NOT swap these — the
 * note in lib/division-rankings.ts explains why they are not symmetrical.
 */
const DIVISIONS = [
  { dt: 1, gender: "F" },
  { dt: 2, gender: "M" },
  { dt: 4, gender: "F" },
  { dt: 5, gender: "M" },
  { dt: 3, gender: "F" },
  { dt: 3, gender: "M" },
];

/**
 * Fetch every board and return `{ snapshot, upstreamCalls, cacheHits }`.
 * Throws on an unreachable upstream or a board below {@link MIN_PLAYERS}; the
 * caller decides what a failure means (the build fails soft while its snapshot
 * is fresh, the cron simply keeps the previous one).
 *
 * @param {{
 *   token: string,
 *   base: string,
 *   bypassCache?: boolean,
 *   cache?: { get: (url: string) => Promise<unknown>, set: (url: string, v: unknown) => Promise<void> },
 *   log?: (msg: string) => void,
 * }} opts
 */
export async function fetchWprSnapshot(opts) {
  const { token, base, bypassCache = false, cache, log = () => {} } = opts;
  const day = new Date().toISOString().slice(0, 10);
  let cacheHits = 0;
  let upstreamCalls = 0;

  // The 250ms spacing, applied only when something actually went upstream —
  // gentle on an API that throttles us, not on Postgres.
  let lastPaced = 0;
  async function pace() {
    if (upstreamCalls === lastPaced) return;
    lastPaced = upstreamCalls;
    await sleep(250);
  }

  async function getJson(params, label) {
    const url = `${base}/v2/data/partner_rankings?${params}`;
    if (!bypassCache && cache) {
      const hit = await cache.get(url);
      if (hit) {
        cacheHits++;
        return hit;
      }
    }
    for (let attempt = 0; ; attempt++) {
      let res;
      try {
        res = await fetch(url, {
          headers: { "PB-API-TOKEN": token },
          signal: AbortSignal.timeout(20000),
          cache: "no-store",
        });
      } catch (err) {
        if (attempt >= RETRIES) throw new Error(`${label}: ${err.message}`);
        await sleep(backoffMs(attempt, null));
        continue;
      }
      if (res.ok) {
        const json = await res.json();
        upstreamCalls++;
        if (cache) await cache.set(url, json);
        return json;
      }
      if ((res.status === 429 || res.status >= 500) && attempt < RETRIES) {
        const wait = backoffMs(attempt, res.headers.get("retry-after"));
        log(
          `${label}: HTTP ${res.status} — retrying in ${Math.round(wait / 1000)}s ` +
            `(attempt ${attempt + 1}/${RETRIES})`,
        );
        await sleep(wait);
        continue;
      }
      throw new Error(`${label}: HTTP ${res.status}`);
    }
  }

  // ⚠ The parameter ORDER is part of the cache key (it is the URL). It matches
  // `fetchBoardPage` in lib/rankings-api.ts and `fetchBoard` in
  // lib/division-rankings.ts, so rows written here serve those too.
  async function page(gender, current) {
    const params = new URLSearchParams({
      partner: "ppa",
      division_type: String(WORLD_DIVISION_TYPE),
      gender,
      race: "false",
      is_live: "false",
      bracket_level_id: String(PRO_BRACKET),
      current_page: String(current),
      page_size: String(PAGE_SIZE),
      rank: day,
    });
    const json = await getJson(params, `partner_rankings ${gender} p${current}`);
    return {
      players: json.results?.player_rankings ?? [],
      total: json.total_records ?? 0,
    };
  }

  async function board(gender) {
    const players = [];
    let total = Infinity;
    for (let p = 1; p <= MAX_PAGES && players.length < total; p++) {
      const got = await page(gender, p);
      if (got.players.length === 0) break;
      players.push(...got.players.map(pick));
      total = got.total;
      if (players.length < total) await pace();
    }
    return { total: Number.isFinite(total) ? total : players.length, players };
  }

  async function divisionBoard(dt, gender) {
    const params = new URLSearchParams({
      partner: "ppa",
      division_type: String(dt),
      gender,
      race: "false",
      is_live: "false",
      bracket_level_id: String(PRO_BRACKET),
      rank: day,
      current_page: "1",
      page_size: String(PAGE_SIZE),
    });
    const json = await getJson(params, `division ${dt}/${gender}`);
    return (json.results?.player_rankings ?? []).map(pickDivision);
  }

  // ⚠ SEQUENTIAL, NOT Promise.all. The partner API limits CONCURRENCY (9/15:
  // 40 parallel → 35x 429, 15 sequential → 15/15 OK).
  const M = await board("M");
  await pace();
  const F = await board("F");
  const boards = { M, F };
  const divisions = {};
  for (const d of DIVISIONS) {
    divisions[`${d.dt}:${d.gender}`] = await divisionBoard(d.dt, d.gender);
    await pace();
  }

  for (const [g, b] of Object.entries(boards)) {
    if (b.players.length < MIN_PLAYERS) {
      throw new Error(
        `${g} came back with only ${b.players.length} players (floor ${MIN_PLAYERS}) — ` +
          `a truncated response, not a smaller tour`,
      );
    }
  }

  return {
    snapshot: { generatedAt: new Date().toISOString(), boards, divisions },
    upstreamCalls,
    cacheHits,
  };
}

/** One-line summary for a build log or a cron response. */
export function describeSnapshot(snapshot, upstreamCalls, cacheHits) {
  const divTotal = Object.values(snapshot.divisions).reduce((n, rows) => n + rows.length, 0);
  return (
    Object.entries(snapshot.boards)
      .map(([g, b]) => `${g} ${b.players.length}/${b.total}`)
      .join(" · ") +
    ` · ${Object.keys(snapshot.divisions).length} division boards (${divTotal} rows)` +
    ` · ${upstreamCalls} upstream, ${cacheHits} cached`
  );
}
