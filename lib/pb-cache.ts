/**
 * Cached JSON GET against the Pickleball.com partner API, backed by our own
 * Postgres table rather than Next's cache.
 *
 * ── WHY WE DO NOT USE NEXT'S CACHE FOR THIS ──────────────────────────────────
 * ⚠ EVERY DEPLOYMENT INVALIDATES EVERY NEXT CACHE ENTRY, BY DESIGN, IN BOTH
 * MECHANISMS. That is not a bug to work around in configuration — it is how the
 * keys are built:
 *
 *   unstable_cache  `const fixedKey = ${cb.toString()}-${keyParts.join(',')}`
 *                   — the minified function source is part of the key, so it
 *                     changes whenever the bundle changes. `keyParts` is
 *                     concatenated onto it, not a replacement for it.
 *   'use cache'     the docs list the key components outright: "Build ID —
 *                   Unique per build, changing this invalidates all cache
 *                   entries".
 *
 * `cacheHandlers` only moves where entries are STORED; the Build ID stays in the
 * key, so a new deployment still looks up a different entry.
 *
 * ⚠ AND THAT MATTERED ENORMOUSLY HERE. Measured 9/18: 24 production deploys in
 * 24 hours, median gap 18 minutes. Every one wiped the cache, so a 24-hour
 * window behaved like an 18-minute one and a one-year window on completed
 * tournaments behaved the same way. The direct evidence was
 * `/v2/data/ppa_tournaments` sitting at ~250 calls/hour with a 24-hour window,
 * spread across FIVE live deployments at once (68/64/29/25/19 per hour) — five
 * generations of cache, each rebuilding independently, kept alive by the
 * 12-hour skew-protection window.
 *
 * The upstream is rate-limiting us and their team has alerted on it repeatedly,
 * so "deploy less often" is a real lever but not one to depend on. Keys we own,
 * in a store we own, are unaffected by builds.
 *
 * ── SHAPE ────────────────────────────────────────────────────────────────────
 * Three layers, each with a different job:
 *
 *   1. a per-instance memo — stops a hot path hitting Postgres on every request
 *   2. this table — durable, shared by every instance AND every deployment
 *   3. the upstream call — only on a genuine miss, and only from ONE instance
 *
 * ⚠ AND SINCE 10/2 A MISS IS NOT EVERYONE'S PROBLEM. When a row ages out, one
 * instance takes a short lease and refreshes it; every other instance keeps
 * serving the row it found, up to `staleLimitS`. A refused refresh falls back to
 * that same row instead of retrying, and its unreleased lease keeps the rest of
 * the fleet from trying again for LEASE_S. Freshness is the row's age against
 * each caller's own window, so two callers sharing a URL no longer set each
 * other's expiry.
 *
 * ⚠ IT FAILS OPEN AT EVERY LAYER. A missing DATABASE_URL, a slow query, a
 * malformed row: all of them fall through to the live API. The cache may never
 * make the site worse than having no cache, which is the whole reason the DB
 * work is wrapped and time-boxed rather than awaited freely.
 *
 * ⚠ AND A FAILED UPSTREAM CALL IS NEVER STORED. `fetchJson` throws; only a
 * resolved value is written. Caching a failure on the one-year window would
 * mean caching it effectively forever.
 *
 * Server-only. Never throws — returns null on give-up, matching the old
 * `pbGetJson` contract its callers already handle.
 */
import { createHash } from "node:crypto";
import { neon, neonConfig } from "@neondatabase/serverless";

const FETCH_TIMEOUT_MS = 8000;
/**
 * Retries after a 429/5xx.
 *
 * ⚠ THREE ONLY DURING `next build`, ONE AT RUNTIME, NONE WHEN A STALE COPY EXISTS
 * (10/2). Every retry is another request into a concurrency limit that is
 * already full, and Vercel recorded ~10K 429s in the first five days of Las
 * Vegas, half of them on the live ticker. A request that has a slightly old copy
 * to fall back on gains nothing by asking again. A build still retries hard,
 * because a prerendered page that gives up bakes "unavailable" into a static
 * page for a day.
 */
const FETCH_RETRIES = 3;
const RUNTIME_RETRIES = 1;
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";
/**
 * How long one instance holds the right to refresh a key (10/2).
 *
 * ⚠ IT IS ALSO THE FLEET-WIDE COOLDOWN AFTER A FAILED REFRESH. The holder clears
 * it when its write lands. If the call is refused, the lease is left to run out,
 * so for these seconds nobody else retries that URL. Every instance serves the
 * copy it has instead. That is the backoff the per-instance retry loop could
 * never give us, because it only ever knew about its own requests.
 */
const LEASE_S = 10;
/** How long a lease loser waits for the winner's write on a key with nothing to serve. */
const WAIT_POLLS = 5;
const WAIT_POLL_MS = 400;
/** A stale copy is re-checked against the table this soon, so a fresh one is picked up quickly. */
const STALE_MEMO_MS = 2_000;
/**
 * The oldest copy we will serve when a refresh is refused or is someone else's
 * job: six windows, and never less than two minutes. A 20s scoreboard falls back
 * to at most two minutes old; the 24h calendar to six days.
 */
function staleLimitS(ttlSeconds: number): number {
  return Math.max(ttlSeconds * 6, 120);
}
/**
 * How long a value may be served from this instance's memory before we ask
 * Postgres again.
 *
 * ⚠ DELIBERATELY SHORT, AND NOT A SECOND CACHE. Its only job is to keep a
 * 15-second ticker poll from doing a database round trip per request. The
 * durable answer still lives in the table, so an entry purged there is picked
 * up within this window rather than lingering for a full revalidate period.
 */
const MEMO_MS = 5_000;
/** The DB is an optimisation; it must never hold up a live request. */
const DB_TIMEOUT_MS = 2_000;

function backoffMs(attempt: number, retryAfter: string | null): number {
  const ra = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra * 1000, 6000);
  return Math.min(400 * 2 ** attempt, 4000) + Math.floor(Math.random() * 300);
}

/**
 * ⚠ THE DATABASE MUST NOT GO THROUGH NEXT'S PATCHED fetch, AND IT HAD BEEN (found 9/28).
 * The Neon HTTP driver speaks SQL as a POST over `fetch`, and on a route that
 * is `force-static` (/rankings, the homepage) or declares `fetchCache =
 * "default-cache"` (/api/rankings) Next's patched fetch treats that POST as
 * cacheable. Measured in `.next/cache/fetch-cache` on a production build: our
 * `SELECT`s, the `CREATE TABLE`s and the rest stored as Data Cache entries with
 * **revalidate 31536000 — a year.** On those routes a read returned whatever the
 * table held the first time that exact query ran, and a cached `INSERT` meant the
 * write never reached the table again. It surfaced when the daily rankings
 * snapshot (lib/wpr-snapshot.ts) was written and /rankings kept serving the old
 * one.
 *
 * So SQL goes out on the fetch Next wraps, which it keeps as
 * `_nextOriginalFetch`. Resolved per call, because Next patches the global after
 * this module may have loaded. ⚠ That property is a Next internal: if an upgrade
 * drops it this falls back to the patched fetch — i.e. back to the bug, silently.
 * Re-check with a marker row after a Next upgrade (see docs in the 9/28 log).
 */
neonConfig.fetchFunction = (input: RequestInfo | URL, init?: RequestInit) => {
  const f = globalThis.fetch as typeof fetch & { _nextOriginalFetch?: typeof fetch };
  return (f._nextOriginalFetch ?? f)(input, init);
};

function db() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

/** Is the durable layer available at all? False simply means "always fetch". */
export function pbCacheConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let ready: Promise<void> | null = null;

/**
 * Create the table once per process — same idempotent pattern as
 * lib/push-store.ts, no migration step.
 *
 * ⚠ `value` IS TEXT, NOT JSONB. We only ever round-trip these blobs; jsonb would
 * buy nothing and would make Postgres parse and re-serialise ~350 KB of calendar
 * on every read and write.
 */
async function init(sql: NonNullable<ReturnType<typeof db>>): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS api_cache (
          key        TEXT PRIMARY KEY,
          url        TEXT NOT NULL,
          tag        TEXT NOT NULL,
          value      TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`CREATE INDEX IF NOT EXISTS api_cache_tag_idx ON api_cache (tag)`;
      await sql`CREATE INDEX IF NOT EXISTS api_cache_expires_idx ON api_cache (expires_at)`;
      // The refresh lease (10/2). Nullable, so older deployments still running
      // under skew protection read and write the table exactly as before.
      await sql`ALTER TABLE api_cache ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

/** A stable key. The URL can be long; the hash is what the table is keyed on. */
function keyFor(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

/** Wrap any DB work so a slow or broken database can never hold a request. */
async function timeboxed<T>(work: Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), DB_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * ⚠ THE PARTNER API LIMITS CONCURRENCY, NOT VOLUME, AND THIS GATE IS THE ONLY
 * THING ENFORCING THAT NOW (moved here 9/23).
 *
 * Measured 9/15 against api.pickleball.com, same token, same endpoint, same
 * minute: 40 requests fired in parallel returned 5x 200 and 35x 429, while 15
 * sent sequentially 200ms apart returned 15/15 OK. The budget is roughly five
 * in flight; total calls per hour is not what it counts.
 *
 * ⚠ IT USED TO LIVE IN lib/pb-fetch.ts, IN FRONT OF `pbGetJson`. As callers
 * migrated here one at a time for the deploy-durability the header describes,
 * each one silently left the gate behind, and by 9/23 nothing called `pbGetJson`
 * at all — so the protection was guarding an empty room. `lib/scores-api.ts`
 * is the caller that makes this matter: it fans out with `Promise.all` across a
 * tournament's divisions, which on the live Arizona event measured 16 calls at a
 * PEAK OF 6 CONCURRENT and took 4x 429.
 *
 * ⚠ THIS BOUNDS ONE PROCESS, NOT THE FLEET. The limit is per platform token,
 * shared across every lambda instance and every build worker, and nothing here
 * can see the others. What it fixes is the self-inflicted burst: no single
 * render can put more than {@link MAX_IN_FLIGHT} of our own requests on the wire
 * at once. Fleet-wide headroom comes from the cache above it.
 *
 * Tune with `PB_MAX_CONCURRENCY` if the API team gives us a real number; the
 * default is deliberately one under the five measured, since the budget is
 * shared with every other instance.
 */
const MAX_IN_FLIGHT = Math.max(1, Number(process.env.PB_MAX_CONCURRENCY) || 4);

let live = 0;
const waiting: (() => void)[] = [];

/**
 * Run `fn` holding a concurrency slot.
 *
 * ⚠ THE SLOT COVERS THE NETWORK CALL AND NOTHING ELSE. It is never held across
 * a retry backoff, so a gated call can never sit on a slot waiting for
 * something that needs one — the only way a gate like this deadlocks.
 */
async function gated<T>(fn: () => Promise<T>): Promise<T> {
  if (live < MAX_IN_FLIGHT) live++;
  else await new Promise<void>((resolve) => waiting.push(resolve));
  try {
    return await fn();
  } finally {
    // Hand the slot straight to the next waiter rather than decrementing and
    // letting it re-race for it.
    const next = waiting.shift();
    if (next) next();
    else live--;
  }
}

/**
 * The uncached call, with the same 429 backoff the old `pbGetJson` did.
 *
 * ⚠ IT THROWS RATHER THAN RETURNING NULL. See the header: only a resolved value
 * is ever written, so a rate-limited response cannot become a cached one.
 */
async function fetchJson(
  url: string,
  tokenOverride: string | undefined,
  retries: number,
): Promise<unknown> {
  const token = tokenOverride ?? process.env.PB_API_TOKEN;
  if (!token) throw new Error("PB_API_TOKEN unset");
  for (let attempt = 0; ; attempt++) {
    // One attempt inside a slot. Returning rather than sleeping in here is what
    // keeps the backoff OUTSIDE the gate.
    const outcome = await gated(
      async (): Promise<{ done: true; value: unknown } | { done: false; retryAfter: string | null }> => {
        const res = await fetch(url, {
          headers: { "PB-API-TOKEN": token },
          cache: "no-store",
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (res.ok) return { done: true, value: (await res.json()) as unknown };
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          return { done: false, retryAfter: res.headers.get("retry-after") };
        }
        // ⚠ THE STATUS RIDES ON THE ERROR. lib/pb-news branches on 401/403 to
        // tell "not authorised for this endpoint" apart from "something broke",
        // and that distinction is the only thing that makes a denied feed
        // diagnosable.
        const err = new Error(`${new URL(url).pathname} ${res.status}`) as Error & {
          status?: number;
        };
        err.status = res.status;
        throw err;
      },
    );
    if (outcome.done) return outcome.value;
    await new Promise((r) => setTimeout(r, backoffMs(attempt, outcome.retryAfter)));
  }
}

type Sql = NonNullable<ReturnType<typeof db>>;

/**
 * One row, with its age in seconds. `value` is undefined for a lease placeholder
 * or a corrupt row. Returns null when the database failed, which callers treat as
 * "no cache at all", never as "no row".
 */
async function readRow(sql: Sql, key: string): Promise<{ value: unknown; age: number } | null> {
  const rows = await timeboxed(
    (async () => {
      await init(sql);
      return sql`SELECT value, EXTRACT(EPOCH FROM (now() - updated_at)) AS age
                 FROM api_cache WHERE key = ${key}`;
    })(),
  );
  if (rows === null) return null;
  const r = (rows as { value: string; age: string | number }[])[0];
  if (!r) return { value: undefined, age: Infinity };
  let value: unknown;
  try {
    // A placeholder's value is "", which does not parse: there is nothing to serve.
    value = r.value ? (JSON.parse(r.value) as unknown) : undefined;
  } catch {
    value = undefined;
  }
  return { value, age: Number(r.age) };
}

/**
 * Try to become the one instance that refreshes `key`. True: go and fetch.
 * False: another instance holds it. Null (database failed): treat as true.
 *
 * ⚠ A KEY WITH NO ROW YET STILL NEEDS SOMETHING TO LOCK, so the claim inserts a
 * placeholder: empty value, `updated_at` at the epoch so it is never fresh, and
 * `expires_at` already past so older deployments read it as a miss. The real
 * write replaces it.
 */
async function claimLease(sql: Sql, key: string, url: string, tag: string): Promise<boolean | null> {
  const rows = await timeboxed(
    (async () => {
      await init(sql);
      return sql`
        INSERT INTO api_cache (key, url, tag, value, expires_at, updated_at, lease_until)
        VALUES (${key}, ${url}, ${tag}, '', now() - interval '1 second', 'epoch',
                now() + ${`${LEASE_S} seconds`}::interval)
        ON CONFLICT (key) DO UPDATE
          SET lease_until = EXCLUDED.lease_until
          WHERE api_cache.lease_until IS NULL OR api_cache.lease_until < now()
        RETURNING key`;
    })(),
  );
  if (rows === null) return null;
  return (rows as unknown[]).length > 0;
}

/** Poll briefly for another instance's write to land. Undefined if it never does. */
async function waitForWrite(sql: Sql, key: string, ttlSeconds: number): Promise<unknown> {
  for (let i = 0; i < WAIT_POLLS; i++) {
    await new Promise((r) => setTimeout(r, WAIT_POLL_MS));
    const row = await readRow(sql, key);
    if (row === null) return undefined;
    if (row.value !== undefined && row.age < ttlSeconds) return row.value;
  }
  return undefined;
}

type Memo = { value: unknown; expires: number };
const memo = new Map<string, Memo>();
/**
 * ⚠ SINGLE-FLIGHT PER INSTANCE, OR A COLD START IS A STAMPEDE. Without it, every
 * concurrent request arriving at a fresh instance issues its own upstream call —
 * which is exactly the amplification that turned a rate limit into an outage on
 * 9/17.
 */
const inFlight = new Map<string, Promise<unknown | null>>();

/**
 * GET `url`, served from the durable cache for `ttlSeconds`.
 *
 * `tag` groups entries so they can be purged together — see
 * {@link purgeCacheTag}. Returns null on any failure.
 */
async function load(
  url: string,
  ttlSeconds: number,
  tag: string,
  token?: string,
): Promise<unknown> {
  const key = keyFor(url);

  const hit = memo.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const remember = (value: unknown, ms: number = MEMO_MS) => {
    memo.set(key, { value, expires: Date.now() + ms });
    return value;
  };

  const work = (async (): Promise<unknown | null> => {
    const sql = db();
    // No database: the old behaviour, straight to the API.
    if (!sql) return remember(await fetchJson(url, token, IS_BUILD ? FETCH_RETRIES : RUNTIME_RETRIES));

    /**
     * ⚠ FRESHNESS IS JUDGED BY THE ROW'S AGE AGAINST THIS CALLER'S WINDOW, NOT BY
     * `expires_at` (10/2). Scores (20s) and brackets (90s) read the very same
     * `tournament_events/{id}` URLs, so they share rows. Under `expires_at`,
     * whoever wrote last set freshness for both, so a bracket refresh was
     * dictating the scoreboard and the other way round. Each caller now decides
     * for itself. `expires_at` is still written, for the sweep and for older
     * deployments under skew protection, which read it.
     */
    const row = await readRow(sql, key);
    if (row === null) {
      // The database failed or timed out. Fail open, as before.
      return remember(await fetchJson(url, token, IS_BUILD ? FETCH_RETRIES : RUNTIME_RETRIES));
    }
    if (row.value !== undefined && row.age < ttlSeconds) return remember(row.value);
    const stale = row.value !== undefined && row.age < staleLimitS(ttlSeconds) ? row.value : undefined;

    /**
     * ⚠ ONE INSTANCE REFRESHES; EVERY OTHER INSTANCE SERVES WHAT IS THERE (10/2).
     *
     * The single-flight above only dedupes within this instance. When a hot row
     * aged out, every warm instance missed at the same moment and each sent its
     * own request. That is a burst straight into a limit of a few requests in
     * flight per token, fleet-wide, and the reason a 12-request probe on Las
     * Vegas Friday morning got 11 refusals. The lease turns that burst into one
     * request.
     */
    const won = await claimLease(sql, key, url, tag);
    if (won === false) {
      if (stale !== undefined) return remember(stale, STALE_MEMO_MS);
      // Nothing usable to serve: give the winner a moment to write.
      const fresh = await waitForWrite(sql, key, ttlSeconds);
      if (fresh !== undefined) return remember(fresh);
      // The winner failed or is slow. Ask ourselves, once, rather than return nothing.
      return remember(await fetchJson(url, token, 0));
    }

    let value: unknown;
    try {
      value = await fetchJson(
        url,
        token,
        IS_BUILD ? FETCH_RETRIES : stale !== undefined ? 0 : RUNTIME_RETRIES,
      );
    } catch (err) {
      // ⚠ THE LEASE IS LEFT TO RUN OUT ON PURPOSE: it is the cooldown. See LEASE_S.
      if (stale !== undefined) return remember(stale, STALE_MEMO_MS);
      throw err;
    }

    remember(value);
    // ⚠ NOT AWAITED ON THE CRITICAL PATH beyond its own timebox: the caller
    // already has the value, and a slow write must not delay the response.
    // The write also releases the lease.
    void timeboxed(
      (async () => {
        const body = JSON.stringify(value);
        await sql`
          INSERT INTO api_cache (key, url, tag, value, expires_at, updated_at, lease_until)
          VALUES (${key}, ${url}, ${tag}, ${body},
                  now() + ${`${ttlSeconds} seconds`}::interval, now(), NULL)
          ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value,
                tag = EXCLUDED.tag,
                expires_at = EXCLUDED.expires_at,
                updated_at = now(),
                lease_until = NULL`;
        return true;
      })(),
    );
    return value;
  })();

  inFlight.set(key, work);
  try {
    return await work;
  } finally {
    inFlight.delete(key);
  }
}

/**
 * GET `url`, served from the durable cache for `ttlSeconds`.
 *
 * Returns null on any failure, matching the old `pbGetJson` contract that the
 * live-data adapters already handle. `tag` groups entries for {@link purgeCacheTag}.
 */
export async function pbCachedJson(
  url: string,
  ttlSeconds: number,
  tag: string,
  token?: string,
): Promise<unknown | null> {
  try {
    return await load(url, ttlSeconds, tag, token);
  } catch {
    return null;
  }
}

/**
 * The same, but rethrows instead of returning null.
 *
 * ⚠ FOR CALLERS THAT BRANCH ON THE STATUS. lib/pb-news distinguishes a 401/403
 * ("this token is not authorised for the news endpoint") from any other failure,
 * and collapsing that into null would turn a precise, actionable message into a
 * blank feed with no explanation. The error carries `.status`.
 */
export async function pbCachedJsonStrict(
  url: string,
  ttlSeconds: number,
  tag: string,
  token?: string,
): Promise<unknown> {
  return load(url, ttlSeconds, tag, token);
}

/**
 * Drop every entry carrying `tag`. The manual escape hatch for a corrected
 * result — the counterpart to `revalidateTag`, which cannot reach this table.
 *
 * ⚠ IT ALSO CLEARS THE PER-INSTANCE MEMO ON THIS INSTANCE ONLY. Other instances
 * keep theirs for at most MEMO_MS, which is why that value is seconds rather
 * than minutes.
 */
export async function purgeCacheTag(tag: string): Promise<number> {
  memo.clear();
  const sql = db();
  if (!sql) return 0;
  const rows = await timeboxed(
    (async () => {
      await init(sql);
      return sql`DELETE FROM api_cache WHERE tag = ${tag} RETURNING key`;
    })(),
  );
  return (rows as unknown[] | null)?.length ?? 0;
}

/**
 * Delete expired rows. Nothing depends on this for correctness — reads already
 * filter on `expires_at` — it just stops the table growing without bound.
 */
export async function sweepCache(): Promise<number> {
  const sql = db();
  if (!sql) return 0;
  const rows = await timeboxed(
    (async () => {
      await init(sql);
      return sql`DELETE FROM api_cache WHERE expires_at < now() - interval '1 day' RETURNING key`;
    })(),
  );
  return (rows as unknown[] | null)?.length ?? 0;
}

/**
 * A named value in the same table — for things we assemble ourselves rather
 * than GET from one URL. The daily WPR snapshot (lib/wpr-snapshot.ts) is the
 * first: ten board pages plus six division boards stitched into one object.
 *
 * `name` is stored as the key verbatim (never a sha256, so it cannot collide
 * with a URL row) and as the `url` column prefixed `stored:` so a human reading
 * the table can tell what it is. Returns null on any failure, like everything
 * else here.
 */
export async function readStored(name: string): Promise<{ value: unknown; updatedAt: string } | null> {
  const sql = db();
  if (!sql) return null;
  const rows = await timeboxed(
    (async () => {
      await init(sql);
      return sql`SELECT value, updated_at FROM api_cache WHERE key = ${name} AND expires_at > now()`;
    })(),
  );
  const row = (rows as { value: string; updated_at: string | Date }[] | null)?.[0];
  if (!row) return null;
  try {
    return { value: JSON.parse(row.value), updatedAt: new Date(row.updated_at).toISOString() };
  } catch {
    return null;
  }
}

/** Just the `updated_at` of a stored value — a cheap "has it changed?" probe. */
export async function storedVersion(name: string): Promise<string | null> {
  const sql = db();
  if (!sql) return null;
  const rows = await timeboxed(
    (async () => {
      await init(sql);
      return sql`SELECT updated_at FROM api_cache WHERE key = ${name} AND expires_at > now()`;
    })(),
  );
  const at = (rows as { updated_at: string | Date }[] | null)?.[0]?.updated_at;
  return at ? new Date(at).toISOString() : null;
}

/**
 * Write a named value. ⚠ AWAITED AND REPORTED, unlike the fire-and-forget write
 * in `load`: the caller is a job whose only output is this row, so it needs to
 * know whether it landed. Uses its own longer timeout — a ~700 KB write is not
 * a request-path read.
 */
export async function writeStored(
  name: string,
  tag: string,
  value: unknown,
  ttlSeconds: number,
): Promise<boolean> {
  const sql = db();
  if (!sql) return false;
  const body = JSON.stringify(value);
  try {
    await init(sql);
    await sql`
      INSERT INTO api_cache (key, url, tag, value, expires_at, updated_at)
      VALUES (${name}, ${`stored:${name}`}, ${tag}, ${body},
              now() + ${`${ttlSeconds} seconds`}::interval, now())
      ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value,
            tag = EXCLUDED.tag,
            expires_at = EXCLUDED.expires_at,
            updated_at = now()`;
    return true;
  } catch {
    return false;
  }
}
