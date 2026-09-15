#!/usr/bin/env node
/**
 * Snapshot the World Pickleball Rankings boards to `lib/data/wpr-snapshot.json`.
 *
 * ⚠ THIS EXISTS BECAUSE RENDERING A PAGE SHOULD NOT COST TEN UPSTREAM CALLS.
 * `getWprPlayerBySlug`, `getRankingBySlug` and `getWprIndex` all read the WHOLE
 * board (correctly — see the 9/4 note about 17 profiles blanking at rank 251+),
 * which is up to six pages for the men's board and four for the women's. That
 * is fine ONCE. It is not fine per render, and on 9/5 it was measured at 6.1K
 * `partner_rankings` calls in an hour from `/athletes/[slug]` alone, with pages
 * taking 17-30s and never caching.
 *
 * It is also what was breaking the BUILD. `next build` fans out across 29
 * worker processes, each with its own module cache, all paging the same boards
 * while the partner API throttles them — the tail of the build crawled at about
 * a minute a page, and only 132 of 203 athletes came out prerendered. The other
 * 71 (Ben Johns, Anna Leigh Waters and Hunter Johnson among them — the
 * most-visited pages on the site) fell back to being rendered on every request,
 * which then kept us throttled. A loop that got worse with every deploy.
 *
 * With a snapshot on disk the boards cost ZERO calls at render and at build, so
 * every athlete prerenders and a page view makes no ranking request at all.
 *
 * Usage:
 *   node scripts/snapshot-rankings.mjs          # write the snapshot
 *   node scripts/snapshot-rankings.mjs --check  # verify without writing
 *
 * ⚠ FAILS SOFT ON PURPOSE. If the API is unreachable or throttled this exits 0
 * and leaves the previous snapshot in place, because a stale board is a far
 * better outcome than a build that either dies or silently ships no rankings.
 * It only exits non-zero if it fetched something and that something looked
 * wrong — see the sanity floor below.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve("lib/data/wpr-snapshot.json");
const PAGE_SIZE = 250;
const MAX_PAGES = 10;
const PRO_BRACKET = 2;
const WORLD_DIVISION_TYPE = 8;
/** Below this a board is not credible — refuse to overwrite a good snapshot. */
const MIN_PLAYERS = 200;
/**
 * ⚠ MUST MATCH `SNAPSHOT_MAX_AGE_MS` IN lib/rankings-api.ts. That is the age at
 * which the renderer stops trusting this file and every board read falls
 * through to the live API — i.e. the cliff this script exists to keep us away
 * from. A .mjs build step cannot import the .ts constant, so the number is
 * written down twice; change them together.
 */
const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * How much warning we want before that cliff. A failed refresh with three days
 * of snapshot left is a blip; with one day left it is the start of the 9/15
 * incident, and it should stop a deploy rather than ride along inside one.
 */
const STALE_WARNING_MS = 2 * 24 * 60 * 60 * 1000;

/** Age of the snapshot already on disk, or null if there isn't a readable one. */
function existingSnapshotAgeMs() {
  if (!existsSync(OUT)) return null;
  try {
    const generatedAt = JSON.parse(readFileSync(OUT, "utf8"))?.generatedAt;
    const age = Date.now() - Date.parse(generatedAt ?? "");
    return Number.isFinite(age) ? age : null;
  } catch {
    return null;
  }
}

const days = (ms) => (ms / 86400000).toFixed(1);

/**
 * What to do when we could not refresh.
 *
 * ⚠ FAIL SOFT ONLY WHILE THE SNAPSHOT ON DISK IS STILL GOOD. That was the whole
 * bug on 9/15: the refresh had been failing since 9/5, said so on one quiet log
 * line, and exited 0 every time — so the file sailed past its 7-day expiry on
 * 9/12, the site silently moved onto the live API, and it stayed there for three
 * days at 27K calls in six hours from /athletes/[slug] alone.
 *
 * Preserving a FRESH snapshot is the right call and still exits 0. Preserving an
 * EXPIRED one is shipping a known outage, so that exits 1 and takes the build
 * with it. Deliberately, and with the cost understood: an unrelated deploy can
 * be blocked by this. That is the trade — a blocked deploy is visible in sixty
 * seconds, and the silent version went unnoticed for ten days.
 */
function reportRefreshFailure(reason) {
  const age = existingSnapshotAgeMs();
  const rerun = "npm run rankings:snapshot";
  if (age === null) {
    console.error(
      `[wpr-snapshot] ${reason} — AND THERE IS NO USABLE SNAPSHOT ON DISK, so every board read ` +
        `would hit the live API on every render. Refusing to build.`,
    );
    process.exitCode = 1;
    return;
  }
  if (age > SNAPSHOT_MAX_AGE_MS) {
    console.error(
      `[wpr-snapshot] ${reason} — AND THE SNAPSHOT ON DISK IS ${days(age)} DAYS OLD, past the ` +
        `${days(SNAPSHOT_MAX_AGE_MS)}-day limit lib/rankings-api.ts will trust. It is already being ` +
        `ignored at render, so every page view is paying for the full board upstream. Refusing to ` +
        `build. Re-run '${rerun}' once the API stops throttling.`,
    );
    process.exitCode = 1;
    return;
  }
  if (age > SNAPSHOT_MAX_AGE_MS - STALE_WARNING_MS) {
    console.error(
      `[wpr-snapshot] ${reason} — and the snapshot on disk is ${days(age)} days old, within ` +
        `${days(STALE_WARNING_MS)} days of the ${days(SNAPSHOT_MAX_AGE_MS)}-day limit. Once it ` +
        `expires every render goes to the live API. Refusing to build while it is this close; ` +
        `re-run '${rerun}' when upstream recovers.`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(`[wpr-snapshot] ${reason} — keeping the existing snapshot (${days(age)} days old).`);
}

function env(name) {
  if (process.env[name]) return process.env[name];
  // .env.local is not loaded for a bare `node` run.
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const line = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).replace(/^["']|["']$/g, "").trim();
  }
  return undefined;
}

const TOKEN = env("PB_API_TOKEN");
const BASE = (env("PB_API_BASE_URL") || "https://api.pickleball.com").replace(/\/$/, "");

/**
 * ⚠ THE REFRESH MUST SURVIVE BEING THROTTLED, OR IT CAN NEVER BREAK THE LOOP IT
 * EXISTS TO PREVENT (9/15).
 *
 * Until today this script had no retry at all: one 429 on any page aborted the
 * whole run and it kept the existing snapshot. That is the right failure mode
 * when the snapshot on disk is fresh — and a trap when it is not, because the
 * two states feed each other. A stale snapshot puts every render back on the
 * live API; that traffic gets us rate-limited; and the rate limit is what stops
 * the next build refreshing the snapshot. Measured today: last regenerated 9/5,
 * expired 9/12, and --check died on page 2 of the women's board with an HTTP
 * 429 while /athletes/[slug] alone was making 27K partner_rankings calls in six
 * hours.
 *
 * So: the same backoff as lib/pb-fetch.ts, honouring Retry-After, and MORE
 * patience than a render path gets rather than less. Nothing is waiting on this
 * — it is a build step that runs once — so minutes of backoff here are cheap
 * against a day of every page view paying for the board.
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

/**
 * One partner_rankings GET, retried through 429/5xx and network errors.
 * `label` only names the board in the log, so a failure says which one died.
 */
async function getJson(params, label) {
  const url = `${BASE}/v2/data/partner_rankings?${params}`;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { "PB-API-TOKEN": TOKEN },
        signal: AbortSignal.timeout(20000),
      });
    } catch (err) {
      if (attempt >= RETRIES) throw new Error(`${label}: ${err.message}`);
      await sleep(backoffMs(attempt, null));
      continue;
    }
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < RETRIES) {
      const wait = backoffMs(attempt, res.headers.get("retry-after"));
      console.log(
        `[wpr-snapshot] ${label}: HTTP ${res.status} — retrying in ${Math.round(wait / 1000)}s ` +
          `(attempt ${attempt + 1}/${RETRIES})`,
      );
      await sleep(wait);
      continue;
    }
    throw new Error(`${label}: HTTP ${res.status}`);
  }
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
    rank: new Date().toISOString().slice(0, 10),
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
    // Gentle on an API we have been throttled by today.
    if (players.length < total) await sleep(250);
  }
  return { total: Number.isFinite(total) ? total : players.length, players };
}

/**
 * The six DIVISION boards behind the athlete page’s per-discipline ranks.
 *
 * ⚠ THESE ARE A SECOND, SEPARATE `partner_rankings` QUERY, AND MISSING THEM IS
 * WHY THE FIRST SNAPSHOT ONLY GOT US 90% (9/5). Snapshotting the WPR boards took
 * /athletes/[slug] from ~5,000 calls/hour to ~660, and the remainder was all
 * this: every render calls `getDivisionRanks`, which fetches three boards
 * (singles, doubles, mixed) for that pro’s gender. Six combinations cover the
 * whole roster, so they belong on disk for exactly the same reason the WPR
 * boards do.
 *
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

/** Only what lib/division-rankings.ts reads off a row. */
const pickDivision = (p) => ({
  player_slug: p.player_slug,
  ranking: p.ranking,
  points: p.points,
});

async function divisionBoard(dt, gender) {
  const params = new URLSearchParams({
    partner: "ppa",
    division_type: String(dt),
    gender,
    race: "false",
    is_live: "false",
    bracket_level_id: String(PRO_BRACKET),
    rank: new Date().toISOString().slice(0, 10),
    current_page: "1",
    page_size: String(PAGE_SIZE),
  });
  const json = await getJson(params, `division ${dt}/${gender}`);
  return (json.results?.player_rankings ?? []).map(pickDivision);
}

async function main() {
  const check = process.argv.includes("--check");
  if (!TOKEN) {
    // ⚠ A BUILD WITHOUT THE TOKEN CANNOT REFRESH, AND THAT IS NOT AUTOMATICALLY
    // FINE. It is fine on a fork or a local checkout with a fresh file on disk;
    // it is the 9/15 incident on a production build whose snapshot has expired.
    reportRefreshFailure("no PB_API_TOKEN");
    return;
  }

  let boards;
  let divisions;
  try {
    // ⚠ SEQUENTIAL, NOT Promise.all. Running both boards at once doubles the
    // instantaneous pressure on the endpoint we are being throttled by, which
    // is the one thing this run cannot afford: the whole point is to get a
    // complete snapshot written, and it has all the time in the world to do it.
    const M = await board("M");
    await sleep(250);
    const F = await board("F");
    boards = { M, F };
    // Sequential and spaced: six more calls against an API that has been
    // throttling us today is not worth saving two seconds over.
    divisions = {};
    for (const d of DIVISIONS) {
      divisions[`${d.dt}:${d.gender}`] = await divisionBoard(d.dt, d.gender);
      await sleep(250);
    }
  } catch (err) {
    reportRefreshFailure(`upstream unavailable (${err.message})`);
    return;
  }

  for (const [g, b] of Object.entries(boards)) {
    if (b.players.length < MIN_PLAYERS) {
      console.error(
        `[wpr-snapshot] ${g} came back with only ${b.players.length} players (floor ${MIN_PLAYERS}). ` +
          `Refusing to overwrite — this looks like a truncated response, not a smaller tour.`,
      );
      process.exitCode = 1;
      return;
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    boards,
    divisions,
  };
  const divTotal = Object.values(divisions).reduce((n, rows) => n + rows.length, 0);
  const summary =
    Object.entries(boards)
      .map(([g, b]) => `${g} ${b.players.length}/${b.total}`)
      .join(" · ") + ` · ${Object.keys(divisions).length} division boards (${divTotal} rows)`;

  if (check) {
    console.log(`[wpr-snapshot] --check OK: ${summary}`);
    return;
  }

  writeFileSync(OUT, `${JSON.stringify(payload)}\n`);
  const kb = (Buffer.byteLength(JSON.stringify(payload)) / 1024).toFixed(0);
  console.log(`[wpr-snapshot] wrote ${OUT} — ${summary} (${kb} KB)`);
}

main();
