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
 *   node scripts/snapshot-rankings.mjs          # write it, unless it is fresh
 *   node scripts/snapshot-rankings.mjs --force  # write it regardless of age
 *   node scripts/snapshot-rankings.mjs --check  # verify without writing
 *
 * ⚠ THE BARE FORM READS THROUGH THE DURABLE CACHE, so the second and later
 * deploys of a day write a fresh snapshot without calling upstream at all.
 * `--force` bypasses it. See the cache block below.
 *
 * ⚠ FAILS SOFT ON PURPOSE. If the API is unreachable or throttled this exits 0
 * and leaves the previous snapshot in place, because a stale board is a far
 * better outcome than a build that either dies or silently ships no rankings.
 * It only exits non-zero if it fetched something and that something looked
 * wrong — see the sanity floor below.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { fetchWprSnapshot, describeSnapshot } from "../lib/wpr-snapshot-core.mjs";

const OUT = resolve("lib/data/wpr-snapshot.json");
// The fetching, the page size, the retry policy and the MIN_PLAYERS floor live
// in lib/wpr-snapshot-core.mjs, shared with the daily /api/cron/rankings job.
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
/**
 * ── THE DURABLE CACHE IN FRONT OF THE 16 CALLS ───────────────────────────────
 *
 * ⚠ `prebuild` RUNS ON EVERY DEPLOY, NOT ONCE A DAY, AND THAT IS NOT OPTIONAL
 * (9/23). A refresh is 16 `partner_rankings` calls — ten board pages plus six
 * division boards — against an endpoint that has rate-limited us repeatedly,
 * and the boards move once a day. On 9/18 there were 24 production deploys in
 * 24 hours: ~384 calls to regenerate a file whose contents changed once.
 *
 * ⚠ AND SKIPPING BY FILE AGE DOES NOT WORK HERE, WHICH IS WORTH WRITING DOWN
 * BECAUSE IT IS THE OBVIOUS FIX. Vercel builds from a fresh git checkout, so the
 * file this script sees is always the COMMITTED one — last committed 9/15, i.e.
 * eight days stale and already past {@link SNAPSHOT_MAX_AGE_MS} — never the one
 * the previous deploy generated. An age gate would therefore never fire on
 * Vercel, and making it fire would mean deliberately shipping an expired
 * snapshot, which is the 9/15 incident.
 *
 * So the calls go through the same Postgres table `lib/pb-cache.ts` uses:
 * first deploy of the day pays 16 calls, every deploy after it reads the rows
 * that one wrote and still writes a fully fresh snapshot. Same table, same
 * 24-hour window, same tag, so a `?tag=rankings` purge reaches these too.
 *
 * ⚠ IT FAILS OPEN AT EVERY POINT, LIKE THE MODULE IT MIRRORS. No DATABASE_URL,
 * no table yet, a slow query, a malformed row — all fall through to the live
 * API, which is exactly the behaviour this script had before. The cache may
 * never be the reason a snapshot does not get written.
 *
 * ⚠ THE KEY SCHEME IS COPIED, NOT IMPORTED, because a .mjs build step cannot
 * import the .ts module. It is sha256 of the full URL — keep it identical to
 * `keyFor` in lib/pb-cache.ts or these rows become a second, unpurgeable set.
 */
const CACHE_TTL_S = 60 * 60 * 24;
/** Must match RANKINGS_CACHE_TAG in lib/cache-tags.ts. */
const CACHE_TAG = "rankings";

const dbUrl = () => env("DATABASE_URL");

let sqlClient;
function cacheSql() {
  if (sqlClient === undefined) {
    const url = dbUrl();
    sqlClient = url ? neon(url) : null;
  }
  return sqlClient;
}

const keyFor = (url) => createHash("sha256").update(url).digest("hex");

/** A cached response for `url`, or null for "ask upstream". Never throws. */
async function cacheGet(url) {
  const sql = cacheSql();
  if (!sql) return null;
  try {
    const rows = await sql`SELECT value FROM api_cache WHERE key = ${keyFor(url)} AND expires_at > now()`;
    const raw = rows?.[0]?.value;
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Store a response for the next deploy to read. Never throws. */
async function cacheSet(url, value) {
  const sql = cacheSql();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO api_cache (key, url, tag, value, expires_at)
      VALUES (${keyFor(url)}, ${url}, ${CACHE_TAG}, ${JSON.stringify(value)},
              now() + ${CACHE_TTL_S} * interval '1 second')
      ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at, updated_at = now()`;
  } catch {
    // The table is created by lib/pb-cache.ts at runtime; if this build is the
    // first thing to run, the write simply does not happen and the next one
    // fetches again.
  }
}

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

/**
 * When to ignore the durable cache and go to the API.
 *
 * ⚠ `--check` BYPASSES IT DELIBERATELY. Its job is to answer "can we reach the
 * boards right now", and on 9/15 the thing that finally exposed the outage was
 * a --check dying on an HTTP 429. A --check served from cache would have
 * reported OK through the whole incident.
 */
const BYPASS_CACHE =
  process.argv.includes("--force") || process.argv.includes("--check");
const TOKEN = env("PB_API_TOKEN");
const BASE = (env("PB_API_BASE_URL") || "https://api.pickleball.com").replace(/\/$/, "");

async function main() {
  const check = process.argv.includes("--check");

  if (!TOKEN) {
    // ⚠ A BUILD WITHOUT THE TOKEN CANNOT REFRESH, AND THAT IS NOT AUTOMATICALLY
    // FINE. It is fine on a fork or a local checkout with a fresh file on disk;
    // it is the 9/15 incident on a production build whose snapshot has expired.
    reportRefreshFailure("no PB_API_TOKEN");
    return;
  }

  let result;
  try {
    result = await fetchWprSnapshot({
      token: TOKEN,
      base: BASE,
      bypassCache: BYPASS_CACHE,
      cache: { get: cacheGet, set: cacheSet },
      log: (msg) => console.log(`[wpr-snapshot] ${msg}`),
    });
  } catch (err) {
    // A truncated board is "fetched something and it looked wrong" — refuse to
    // overwrite, loudly. Anything else is upstream being unreachable.
    if (/players \(floor/.test(err.message)) {
      console.error(`[wpr-snapshot] ${err.message}. Refusing to overwrite.`);
      process.exitCode = 1;
      return;
    }
    reportRefreshFailure(`upstream unavailable (${err.message})`);
    return;
  }

  const { snapshot, upstreamCalls, cacheHits } = result;
  const summary = describeSnapshot(snapshot, upstreamCalls, cacheHits);

  if (check) {
    console.log(`[wpr-snapshot] --check OK: ${summary}`);
    return;
  }

  writeFileSync(OUT, `${JSON.stringify(snapshot)}\n`);
  const kb = (Buffer.byteLength(JSON.stringify(snapshot)) / 1024).toFixed(0);
  console.log(`[wpr-snapshot] wrote ${OUT} — ${summary} (${kb} KB)`);
}

main();
