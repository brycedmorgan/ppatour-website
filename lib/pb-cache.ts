/**
 * Cached JSON GET against the Pickleball.com partner API.
 *
 * ── WHY THIS EXISTS, AND WHY `pbGetJson` WAS NOT ENOUGH ──────────────────────
 * ⚠ `next: { revalidate }` DOES NOT RETAIN ENTRIES ON THIS PROJECT. Measured on
 * production 9/18, in a single region (`serverlessFunctionRegion: iad1`, so
 * there is no regional multiplication to hide behind):
 *
 *   /v2/data/ppa_tournaments   24-hour window  ->  620 calls/hour
 *   a completed tournament's divisions, 1-year  ->  213 calls/hour
 *   /v2/data/news              10-minute window ->  351 calls/hour
 *
 * A 24-hour entry read 620 times an hour is never being served. So every
 * `revalidate` value in this codebase has been decorative, and what actually
 * bounded upstream volume was the CDN and the per-instance module caches.
 * The consequence was not academic: pickleball.com's own Grafana alerted on us
 * three times in nine hours ("Platform 9 is being actively rate limited"), and
 * the third one fired on completely ordinary traffic — no spike — which is what
 * established that we sit above their sustained ceiling at rest.
 *
 * `unstable_cache` does hold. Proven on `getEvents` before this file was
 * written: `ppa_tournaments` fell from ~100 to 19 calls per five minutes within
 * fifteen minutes of deploying, and kept falling.
 *
 * ⚠ `unstable_cache` IS DEPRECATED IN FAVOUR OF `use cache`, WHICH IS NOT USABLE
 * HERE YET. `use cache` requires `cacheComponents: true`, an app-wide change to
 * caching semantics. That is the destination; this is the thing that works today
 * without rewriting how all 2,070 pages render.
 *
 * ── HOW THE KEY WORKS, WHICH IS THE WHOLE TRICK ──────────────────────────────
 * `unstable_cache` keys on its `keyParts` plus the ARGUMENTS of the wrapped
 * function. `fetchJson` takes the URL as its only argument, so one wrapper per
 * (window, tag) pair gives every distinct URL its own durable entry. The token
 * is read from the environment inside the wrapped function rather than passed
 * in — a secret must never become part of a cache key.
 *
 * ⚠ AND THE WRAPPERS ARE MEMOISED PER (window, tag). Building a new
 * `unstable_cache` on every call would be wasteful and would risk a key that
 * varies with the closure. There are only ever a handful of distinct windows
 * (live scores, live brackets, upcoming, finished), so the map stays tiny.
 *
 * Server-only. Never throws — returns null on give-up, matching `pbGetJson`.
 */
import { unstable_cache } from "next/cache";

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 3;

function backoffMs(attempt: number, retryAfter: string | null): number {
  const ra = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra * 1000, 6000);
  return Math.min(400 * 2 ** attempt, 4000) + Math.floor(Math.random() * 300);
}

/**
 * The uncached call, with the same 429 backoff `pbGetJson` does.
 *
 * ⚠ IT THROWS RATHER THAN RETURNING NULL, AND THAT IS LOAD-BEARING.
 * `unstable_cache` stores whatever resolves, so a null returned here would cache
 * a failure for the whole window — on a one-year window, effectively forever.
 * Throwing leaves the entry unwritten and the caller falls back for that request
 * alone. This is the same rule `fetchEvents` in lib/events-api.ts follows.
 *
 * ⚠ NO `next: { revalidate }` ON THIS FETCH, DELIBERATELY. The wrapper is the
 * cache now. Leaving a second, non-functioning layer underneath would only make
 * the next person wonder which one is in charge.
 */
async function fetchJson(url: string): Promise<unknown> {
  const token = process.env.PB_API_TOKEN;
  if (!token) throw new Error("PB_API_TOKEN unset");
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { "PB-API-TOKEN": token },
      cache: "no-store",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
    if (res.ok) return (await res.json()) as unknown;
    if ((res.status === 429 || res.status >= 500) && attempt < DEFAULT_RETRIES) {
      await new Promise((r) => setTimeout(r, backoffMs(attempt, res.headers.get("retry-after"))));
      continue;
    }
    throw new Error(`${new URL(url).pathname} ${res.status}`);
  }
}

const wrappers = new Map<string, (url: string) => Promise<unknown>>();

function wrapperFor(revalidate: number, tag: string) {
  const key = `${revalidate}|${tag}`;
  let f = wrappers.get(key);
  if (!f) {
    f = unstable_cache(fetchJson, ["pb-json", key], { revalidate, tags: [tag] });
    wrappers.set(key, f);
  }
  return f;
}

/**
 * GET `url`, served from the durable cache for `revalidate` seconds.
 *
 * Returns null on any failure — an unset token, a give-up after retries, a
 * malformed response — so callers keep the "no data beats wrong data" shape they
 * already have.
 */
export async function pbCachedJson(
  url: string,
  revalidate: number,
  tag: string,
): Promise<unknown | null> {
  try {
    return await wrapperFor(revalidate, tag)(url);
  } catch {
    return null;
  }
}
