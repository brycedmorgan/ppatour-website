/**
 * Shopify Storefront API client — the backend for ppatour.com/shop.
 *
 * The tour runs a headless storefront: Shopify owns products, inventory, orders
 * and checkout; this site renders the pages. Nothing about the catalogue lives
 * in this repo, so a product edit in Shopify reaches the site with no deploy.
 *
 * ⚠ SERVER-ONLY. `SHOPIFY_STOREFRONT_TOKEN` is a public-scope Storefront token,
 * but it is still a credential and there is no reason for it to reach a browser
 * bundle. Every caller here is a server component or a route handler.
 *
 * ⚠ IT FAILS SAFE, AND THAT IS THE WHOLE DESIGN. No token, a bad API version, a
 * 429, a network blip — every one of them returns null, and every consumer
 * renders the shop's holding state rather than an empty grid under a heading
 * that promises product. Same rule as the scores band and the ticket gates: no
 * data beats wrong data.
 *
 * Retry/backoff mirrors `lib/pb-fetch.ts`, which exists because the partner
 * endpoints rate-limit under build load. Shopify rate-limits too, by cost
 * rather than request count, so the same shape applies.
 */

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 3;

/**
 * ⚠ VERIFY THIS AGAINST THE STORE BEFORE LAUNCH. Shopify ships a new Storefront
 * API version quarterly and supports each for a year. An unrecognised version
 * is rejected outright, which under the fail-safe above surfaces as an empty
 * shop rather than an error — quiet, and easy to misread as "no products yet".
 * `npm run shop:check` reports which it is.
 */
export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-07";

/** Cache tag for the whole catalogue, so a webhook can bust it in one call. */
export const SHOP_CACHE_TAG = "shopify-catalog";

/** Products change rarely; inventory changes constantly. 5 minutes splits it. */
export const SHOP_REVALIDATE = 300;

function shopDomain(): string | null {
  const raw = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  if (!raw) return null;
  // Accept "ppa-tour-store", "ppa-tour-store.myshopify.com" or a full URL.
  const bare = raw.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return bare.includes(".") ? bare : `${bare}.myshopify.com`;
}

/**
 * Whether the storefront is configured at all. Consumers gate on this BEFORE
 * querying so an unconfigured deploy costs zero network calls — and so the
 * "shop" nav link and sitemap entries stay absent rather than pointing at a
 * page with nothing on it.
 */
export function shopConfigured(): boolean {
  return Boolean(shopDomain() && process.env.SHOPIFY_STOREFRONT_TOKEN);
}

function backoffMs(attempt: number, retryAfter: string | null): number {
  const ra = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(ra) && ra > 0) return Math.min(ra * 1000, 6000);
  return Math.min(400 * 2 ** attempt, 4000) + Math.floor(Math.random() * 300);
}

type GqlOpts = {
  variables?: Record<string, unknown>;
  /** Omit to bypass the Data Cache entirely — required for cart mutations. */
  revalidate?: number;
  tags?: string[];
  timeoutMs?: number;
  retries?: number;
};

/**
 * Run one Storefront GraphQL operation. Returns the `data` payload, or null on
 * any failure including GraphQL-level errors.
 *
 * ⚠ A 200 WITH AN `errors` ARRAY IS A FAILURE. Shopify answers GraphQL errors
 * with HTTP 200, so `res.ok` alone would hand a caller `{ product: null }` and
 * look like "no such product" rather than "the query was wrong". Those are very
 * different bugs and only one of them is worth paging someone about, so the
 * errors are logged before the null goes back.
 */
export async function shopifyQuery<T>(query: string, opts: GqlOpts = {}): Promise<T | null> {
  const domain = shopDomain();
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) return null;

  const url = `https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = opts.retries ?? DEFAULT_RETRIES;
  const cached = opts.revalidate != null;
  const body = JSON.stringify({ query, variables: opts.variables ?? {} });

  for (let attempt = 0; ; attempt++) {
    // First attempt may read/write the Data Cache; retries go straight to the
    // network so a rate-limit blip is never what gets cached.
    const cacheInit: RequestInit =
      attempt === 0 && cached
        ? { next: { revalidate: opts.revalidate, ...(opts.tags ? { tags: opts.tags } : {}) } }
        : { cache: "no-store" };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body,
        ...cacheInit,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs(attempt, res.headers.get("retry-after"))));
        continue;
      }
      if (!res.ok) {
        console.error(`[shopify] HTTP ${res.status} on ${SHOPIFY_API_VERSION}`);
        return null;
      }

      const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
      if (json.errors?.length) {
        console.error("[shopify] GraphQL errors:", json.errors.map((e) => e.message).join(" · "));
        return null;
      }
      return json.data ?? null;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs(attempt, null)));
        continue;
      }
      return null;
    }
  }
}
