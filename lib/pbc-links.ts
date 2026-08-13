/**
 * Where "Buy This Paddle" actually sends a fan on Pickleball Central.
 *
 * ⚠ NEVER `search.php?search_query=`. That was the destination for every pro
 * without a pinned product URL, and IT RENDERS AN EMPTY PAGE — header, nothing,
 * footer. Not a "no results" message, not a 404: a blank storefront page that
 * looks like the site is broken. It answers 200 with the products present in a
 * Searchanise JSON blob, so curl and a link checker both call it healthy; only a
 * real browser shows that nothing paints. It fails for every query, including
 * one-word ones, so no amount of tidying the search term fixes it.
 * Verified 2026-08-13 across `Franklin C45 Hybrid`, `C45 Hybrid`, `Franklin C45`
 * and `JOOLA Perseus Pro V 16mm`. **Check a commerce link in a browser, not with
 * a status code.**
 *
 * So the destination is a ladder, best to worst, and every rung is a page that
 * has been loaded and confirmed to render products:
 *
 *   1. the exact product page  — pinned per player in Jackalope (`pbcUrl`), or
 *      curated in PRODUCTS below
 *   2. the brand's paddle page — one click from the model they want, and it is
 *      unambiguous about who makes it
 *   3. the paddles category    — only when we don't recognise the brand
 *
 * Rung 2 is what makes this safe as a default: 110 of 127 pros have no pinned
 * URL today, and a brand page is a real shopping page rather than a dead end.
 */

/** Pickleball Central's own paddle-brand pages, keyed by normalized brand.
 *  Slugs read off pickleballcentral.com/paddles/by-brand/ and each one loaded
 *  and confirmed 200 with products (2026-08-13). Covers every manufacturer in
 *  the Jackalope feed that PBC actually stocks. */
const BRAND_PAGES: Record<string, string> = {
  "11six24": "11six24",
  adidas: "adidas-pickleball",
  crbn: "crbn-pickleball-paddles",
  diadem: "diadem-pickleball",
  engage: "engage-pickleball",
  franklin: "franklin-pickleball",
  friday: "friday-pickle",
  holbrook: "holbrook-pickleball-paddles",
  joola: "joola-pickleball-paddles",
  luzz: "luzz-pickleball",
  paddletek: "paddletek-pickleball-paddles",
  pikkl: "pikkl-pickleball",
  proton: "proton-pickleball-paddles",
  rpm: "rpm-pickleball",
  selkirk: "selkirk-sports",
  "six zero": "6-0-six-zero-pickleball-paddles",
  sixzero: "6-0-six-zero-pickleball-paddles",
  vulcan: "vulcan-pickleball-paddles",
};

/**
 * Exact product pages we hold, keyed by normalized paddle name.
 *
 * These are the models whose photo we also cut out (see lib/paddle-images.ts),
 * so the two files cover the same ground on purpose — if we know the product
 * page well enough to take its photo, the buy link should go there too.
 *
 * ⚠ Signature colourways are keyed by ATHLETE SLUG in PRODUCTS_BY_SLUG, for the
 * same reason the photos are: ten pros play the "JOOLA Perseus Pro V 16mm" and
 * JOOLA sells three signature versions of it, so the model name alone cannot
 * pick a product page.
 */
const PRODUCTS: Record<string, string> = {
  "franklin c45 hybrid": "franklin-c45-hybrid-14mm-pickleball-paddle",
  "selkirk project boomstik elongated": "selkirk-labs-project-boomstik-elongated-16mm-pickleball-paddle",
  "luzz pro cannon": "luzz-pro-cannon-pickleball-paddle",
  "11six24 vapor power 2": "11six24-vapor-power-2-pickleball-paddle",
  "crbn trufoam barrage 4": "crbn4-trufoam-barrage-pickleball-paddle",
};

const PRODUCTS_BY_SLUG: Record<string, string> = {
  "ben-johns": "joola-perseus-pro-v-ben-johns-16mm-pickleball-paddle",
  "anna-bright": "joola-scorpeus-pro-v-anna-bright-14mm-pickleball-paddle",
};

/** Every rung of the ladder lives under this host. */
const BASE = "https://www.pickleballcentral.com";

/** The paddles category. Last resort, and still a real shopping page. */
const ALL_PADDLES = `${BASE}/paddles/`;

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * The best Pickleball Central page we can send someone to for this paddle.
 *
 * @param paddle  the paddle as we display it
 * @param brand   the manufacturer, on its own, when the feed gave us one
 * @param slug    the athlete, for signature-colourway products
 * @param pinned  Jackalope's per-player `pbcUrl`, which beats everything
 */
export function pbcDestination(
  paddle: string | null | undefined,
  brand?: string | null,
  slug?: string | null,
  pinned?: string | null,
): string {
  const p = pinned?.trim();
  if (p) return p;

  const bySlug = slug ? PRODUCTS_BY_SLUG[slug] : null;
  if (bySlug) return `${BASE}/${bySlug}/`;

  const key = norm(paddle ?? "");
  if (key) {
    const exact = PRODUCTS[key];
    if (exact) return `${BASE}/${exact}/`;
    for (const [k, v] of Object.entries(PRODUCTS)) {
      // Prefix only, so a thickness suffix still matches but "C45" can't grab a
      // different C45 model.
      if (key.startsWith(k + " ")) return `${BASE}/${v}/`;
    }
  }

  /**
   * Brand page. Prefer the feed's own manufacturer field; fall back to testing
   * the display string against the brand table, because the static broadcast
   * masterlist carries no separate brand column. Longest match wins so
   * "Six Zero" beats a stray short key.
   */
  const b = norm(brand ?? "");
  if (b && BRAND_PAGES[b]) return `${BASE}/paddles/by-brand/${BRAND_PAGES[b]}/`;

  const hay = norm(paddle ?? "");
  const found = Object.keys(BRAND_PAGES)
    .filter((k) => hay === k || hay.startsWith(k + " "))
    .sort((x, y) => y.length - x.length)[0];
  if (found) return `${BASE}/paddles/by-brand/${BRAND_PAGES[found]}/`;

  return ALL_PADDLES;
}
