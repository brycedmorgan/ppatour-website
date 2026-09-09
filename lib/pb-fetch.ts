/**
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
    try {
      const res = await fetch(url, { headers, ...cacheInit, signal: AbortSignal.timeout(timeoutMs) });
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs(attempt, res.headers.get("retry-after"))));
        continue;
      }
      if (!res.ok) return null;
      return (await res.json()) as unknown;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs(attempt, null)));
        continue;
      }
      return null;
    }
  }
}
