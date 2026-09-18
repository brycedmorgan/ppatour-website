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
 *   3. the upstream call — only on a genuine miss
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
import { neon } from "@neondatabase/serverless";

const FETCH_TIMEOUT_MS = 8000;
const FETCH_RETRIES = 3;
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
 * The uncached call, with the same 429 backoff the old `pbGetJson` did.
 *
 * ⚠ IT THROWS RATHER THAN RETURNING NULL. See the header: only a resolved value
 * is ever written, so a rate-limited response cannot become a cached one.
 */
async function fetchJson(url: string): Promise<unknown> {
  const token = process.env.PB_API_TOKEN;
  if (!token) throw new Error("PB_API_TOKEN unset");
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { "PB-API-TOKEN": token },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) return (await res.json()) as unknown;
    if ((res.status === 429 || res.status >= 500) && attempt < FETCH_RETRIES) {
      await new Promise((r) => setTimeout(r, backoffMs(attempt, res.headers.get("retry-after"))));
      continue;
    }
    throw new Error(`${new URL(url).pathname} ${res.status}`);
  }
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
export async function pbCachedJson(
  url: string,
  ttlSeconds: number,
  tag: string,
): Promise<unknown | null> {
  const key = keyFor(url);

  const hit = memo.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const work = (async (): Promise<unknown | null> => {
    const sql = db();

    if (sql) {
      const rows = await timeboxed(
        (async () => {
          await init(sql);
          return sql`SELECT value FROM api_cache WHERE key = ${key} AND expires_at > now()`;
        })(),
      );
      const raw = (rows as { value: string }[] | null)?.[0]?.value;
      if (raw != null) {
        try {
          const value = JSON.parse(raw) as unknown;
          memo.set(key, { value, expires: Date.now() + MEMO_MS });
          return value;
        } catch {
          // A corrupt row is treated as a miss; the write below replaces it.
        }
      }
    }

    let value: unknown;
    try {
      value = await fetchJson(url);
    } catch {
      return null;
    }

    memo.set(key, { value, expires: Date.now() + MEMO_MS });

    if (sql) {
      // ⚠ NOT AWAITED ON THE CRITICAL PATH beyond its own timebox: the caller
      // already has the value, and a slow write must not delay the response.
      void timeboxed(
        (async () => {
          const body = JSON.stringify(value);
          await sql`
            INSERT INTO api_cache (key, url, tag, value, expires_at, updated_at)
            VALUES (${key}, ${url}, ${tag}, ${body},
                    now() + ${`${ttlSeconds} seconds`}::interval, now())
            ON CONFLICT (key) DO UPDATE
              SET value = EXCLUDED.value,
                  tag = EXCLUDED.tag,
                  expires_at = EXCLUDED.expires_at,
                  updated_at = now()`;
          return true;
        })(),
      );
    }
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
