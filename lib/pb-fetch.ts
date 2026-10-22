/**
 * ⚠ NOTHING CALLS THIS ANY MORE (9/23). Every pickleball.com read now goes
 * through `pbCachedJson` in lib/pb-cache.ts, which caches in a Postgres table we
 * own instead of Next's Data Cache — the one difference that matters being that
 * a Next entry does not survive a deployment, so on a day with two dozen deploys
 * every window here effectively reset to minutes. See that file's header.
 *
 * It is kept rather than deleted because a dozen docblocks across the repo point
 * at it for the two things it documents better than anywhere else: the 429
 * backoff contract, and the `revalidate`-survives-`force-dynamic` finding below.
 * ⚠ THE CONCURRENCY GATE BELOW IS NOW DUPLICATED IN lib/pb-cache.ts, and that
 * copy is the one doing the work. It was not deleted from here, because a future
 * caller of `pbGetJson` would then be ungated — but the two are independent
 * counters, so if both files ever had live callers again they would permit
 * {@link MAX_IN_FLIGHT} each. Keep them in step, or better, delete this file.
 *
 * ⚠ IF YOU ARE ABOUT TO USE `pbGetJson` FOR A NEW PARTNER CALL, USE
 * `pbCachedJson` INSTEAD. A new caller here would be uncached across deploys and
 * ungated for concurrency, which is both of the problems this repo has already
 * had an incident about.
 *
 * ── ORIGINAL NOTE ────────────────────────────────────────────────────────────
 * Pickleball.com API JSON fetch with retry + backoff and optional Next Data
 * Cache. The partner endpoints rate-limit (HTTP 429) under load — e.g. building
 * many athlete pages at once — so a bare fetch randomly returns empty.
 *
 * Pass `revalidate` (+ optional `tags`) to store the response in Next's Data
 * Cache (durable across requests, builds, and deploys, and invalidatable via
 * `revalidateTag`). The first attempt uses the cache; retries after a 429/5xx
 * go straight to the network (no-store) so a rate-limit blip isn't what lands
 * in the cache. Returns null on give-up. Server-only.
 *
 * ⚠ `revalidate` SURVIVES `dynamic = "force-dynamic"`, AND NEXT'S OWN DOCS SAY
 * IT DOES NOT. This matters because the live-data route handlers
 * (app/api/ticker, app/api/scores, app/api/brackets) all declare
 * force-dynamic, and every upstream call behind them is made through here or
 * through the same pattern — so if the docs were right, the shared cache on the
 * hottest endpoints on the site would be a silent no-op.
 *
 * The docs (node_modules/next/dist/docs/01-app/02-guides/
 * caching-without-cache-components.md) call force-dynamic “equivalent to …
 * setting the segment config to `export const fetchCache = 'force-no-store'`”,
 * which “forces all fetch requests to be re-fetched every request”. The runtime
 * disagrees: in node_modules/next/dist/server/lib/patch-fetch.js,
 * `pageFetchCacheMode` is read from `workStore.fetchCache` — the EXPLICIT
 * segment config only — and `forceDynamic` is consulted solely through
 * `noFetchConfigAndForceDynamic`, which requires `!currentFetchRevalidate`. An
 * explicit per-fetch revalidate therefore wins, exactly as that code's own
 * comment intends (“top-level modes are responsible for setting reasonable
 * defaults”).
 *
 * ⚠ SO THIS IS LOAD-BEARING AND UNDOCUMENTED. Verified against Next 16.2.6.
 * RE-CHECK IT ON A NEXT UPGRADE: if a release ever aligns the runtime with the
 * doc, these caches stop working and nothing fails loudly — the only symptom is
 * the upstream call rate climbing back to where it was. The fix in that case is
 * to move the fetches out of the force-dynamic segment (a cached function
 * rather than a per-fetch option), not to re-tune the windows.
 */
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 4;

/**
 * ⚠ THE PARTNER API LIMITS CONCURRENCY, NOT VOLUME — AND WE WERE EXCEEDING IT
 * FROM INSIDE A SINGLE REQUEST (9/15).
 *
 * Measured against api.pickleball.com today, same token, same endpoint, same
 * minute: 40 requests fired in parallel returned 5x 200 and 35x 429, while 15
 * requests sent sequentially 200ms apart returned 15/15 OK. So the budget is
 * roughly five in flight at once; total calls per hour is not what it counts.
 *
 * ⚠ AND THE 429 BODY READS AS AN AUTHORIZATION FAILURE, WHICH IS HOW THIS WENT
 * MISDIAGNOSED. It says `platform access denied: platformID=9 path=...`, and
 * platformID 9 is US. A genuine auth problem on this API is a 401 with a
 * different message ("no platform token" / "Platform token record not found"),
 * verified by sending no token and a bad one. Anything saying "access denied"
 * on a 429 is this limit, not a permission we are missing. Do not go asking for
 * access.
 *
 * So: one gate in front of every partner call. `lib/scores-api.ts` fans out
 * with `Promise.all` across a tournament's divisions, which on the live
 * Arizona event measured 16 calls at a PEAK OF 6 CONCURRENT and took 4x 429 --
 * i.e. our own live-scores path was throttling itself on every cold build, and
 * the retry logic was quietly paying for it in latency.
 *
 * ⚠ THIS BOUNDS ONE PROCESS, NOT THE FLEET. The limit is per platform token,
 * shared across every lambda instance and every build worker, and nothing here
 * can see the others. What it does fix is the self-inflicted burst: no single
 * render can put more than {@link MAX_IN_FLIGHT} of our own requests on the
 * wire at once. Fleet-wide headroom comes from the callers making fewer calls
 * at all -- which is what the on-disk rankings snapshot does.
 *
 * Tune with `PB_MAX_CONCURRENCY` if the API team gives us a real number; the
 * default is deliberately one under the five we measured, since the budget is
 * shared with every other instance.
 */
const MAX_IN_FLIGHT = Math.max(1, Number(process.env.PB_MAX_CONCURRENCY) || 4);

let inFlight = 0;
const waiting: (() => void)[] = [];

/**
 * Run `fn` with a concurrency slot held.
 *
 * ⚠ THE SLOT COVERS THE NETWORK CALL AND NOTHING ELSE. It is never held across
 * a caller's own work or across a retry backoff, so a gated call can never sit
 * on a slot while waiting for something that needs one -- which is the only way
 * a gate like this deadlocks.
 */
async function gated<T>(fn: () => Promise<T>): Promise<T> {
  if (inFlight < MAX_IN_FLIGHT) inFlight++;
  else await new Promise<void>((resolve) => waiting.push(resolve));
  try {
    return await fn();
  } finally {
    // Hand the slot straight to the next waiter rather than decrementing and
    // letting it re-race for it.
    const next = waiting.shift();
    if (next) next();
    else inFlight--;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function backoffMs(attempt: number, retryAfter: string | null): number {
  const ra = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra * 1000, 6000);
  return Math.min(400 * 2 ** attempt, 4000) + Math.floor(Math.random() * 300);
}

export async function pbGetJson(
  url: string,
  headers: Record<string, string>,
  opts: { timeoutMs?: number; retries?: number; revalidate?: number; tags?: string[] } = {},
): Promise<unknown | null> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = opts.retries ?? DEFAULT_RETRIES;
  const cached = opts.revalidate != null;
  for (let attempt = 0; ; attempt++) {
    // First try may read/write the Data Cache; retries force a fresh network
    // hit so a cached response is never a 429/5xx.
    const cacheInit: RequestInit =
      attempt === 0 && cached
        ? { next: { revalidate: opts.revalidate, ...(opts.tags ? { tags: opts.tags } : {}) } }
        : { cache: "no-store" };

    // One attempt, inside a concurrency slot. Returning rather than sleeping in
    // here is what keeps the backoff OUTSIDE the gate -- a retry that waited on
    // its slot would hold a quarter of the budget doing nothing.
    let outcome:
      | { retry: false; value: unknown | null }
      | { retry: true; retryAfter: string | null };
    try {
      outcome = await gated(async () => {
        const res = await fetch(url, { headers, ...cacheInit, signal: AbortSignal.timeout(timeoutMs) });
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          return { retry: true as const, retryAfter: res.headers.get("retry-after") };
        }
        if (!res.ok) return { retry: false as const, value: null };
        return { retry: false as const, value: (await res.json()) as unknown };
      });
    } catch {
      if (attempt < retries) {
        await sleep(backoffMs(attempt, null));
        continue;
      }
      return null;
    }

    if (!outcome.retry) return outcome.value;
    await sleep(backoffMs(attempt, outcome.retryAfter));
  }
}
