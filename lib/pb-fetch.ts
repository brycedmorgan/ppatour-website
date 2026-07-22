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
