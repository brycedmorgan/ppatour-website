/**
 * Pickleball.com API JSON fetch with retry + backoff. The partner endpoints
 * rate-limit (HTTP 429) under load — e.g. building many athlete pages at once —
 * so a bare fetch randomly returns empty. This retries 429/5xx (honoring
 * Retry-After) with exponential backoff + jitter. Returns null on give-up.
 * Server-only.
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
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<unknown | null> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = opts.retries ?? DEFAULT_RETRIES;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
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
