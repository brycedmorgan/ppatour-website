/**
 * Pure helpers for the two strings Google actually shows: the <title> and the
 * meta description. No imports, so `scripts/seo-text.test.ts` can run them
 * under `node --experimental-strip-types` with no bundler.
 *
 * The 9/23 crawl found 825 titles over 60 characters, almost all of them
 * because the root layout's template appends " · Carvana PPA Tour" (19 chars)
 * to whatever the page sets. Google renders roughly 600px / ~60 characters and
 * rewrites titles it has to cut, so the brand suffix is the part designed to
 * give way — first to the shorter " · PPA Tour", then entirely.
 *
 *   "Ben Johns Wins Vegas" + " · Carvana PPA Tour"  = 39 chars → keep the template
 *   a 50-char headline     + " · Carvana PPA Tour"  = 69 chars → " · PPA Tour" (61) fits under 65
 *   a 58-char headline     + " · PPA Tour"          = 69 chars → the bare headline
 *
 * Descriptions: Google truncates at ~155–160 characters; a description cut
 * mid-word by Google reads worse than one we ended ourselves.
 */

export const BRAND_SUFFIX = " · Carvana PPA Tour";
export const SHORT_SUFFIX = " · PPA Tour";
/** The width Google reliably shows in full. */
export const TITLE_MAX = 60;
/** The most we tolerate for the shorter-suffix fallback before dropping the brand. */
export const TITLE_HARD_MAX = 65;
export const DESCRIPTION_MAX = 155;

/**
 * The full <title> string for a page title, with the longest suffix that fits.
 *
 * `suffixes` are tried in order: the first must fit inside {@link TITLE_MAX},
 * any later one inside {@link TITLE_HARD_MAX}. If none fits the bare title is
 * returned, even if it is itself over the limit — a headline is not ours to cut.
 */
export function fitTitle(
  title: string,
  suffixes: readonly string[] = [BRAND_SUFFIX, SHORT_SUFFIX],
): string {
  const base = title.replace(/\s+/g, " ").trim();
  for (let i = 0; i < suffixes.length; i++) {
    const candidate = `${base}${suffixes[i]}`;
    if (candidate.length <= (i === 0 ? TITLE_MAX : TITLE_HARD_MAX)) return candidate;
  }
  return base;
}

/**
 * What to hand Next's `metadata.title` for a page under the root layout's
 * `%s · Carvana PPA Tour` template. Returns the plain title when the templated
 * result fits (so the layout keeps doing its job) and `{ absolute }` with the
 * shorter or no suffix when it does not.
 */
export function pageTitle(title: string): string | { absolute: string } {
  const base = title.replace(/\s+/g, " ").trim();
  const fitted = fitTitle(base);
  return fitted === `${base}${BRAND_SUFFIX}` ? base : { absolute: fitted };
}

/**
 * Truncates a description to `max` characters on a word boundary, ending with
 * an ellipsis. Whitespace is collapsed first; a string that already fits is
 * returned unchanged (apart from that collapse). Trailing punctuation left
 * dangling by the cut (",", ";", ":", "—") is dropped before the ellipsis.
 */
export function seoDescription(text: string, max: number = DESCRIPTION_MAX): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  // Room for the ellipsis itself.
  const room = max - 1;
  let cut = s.slice(0, room + 1);
  const lastSpace = cut.lastIndexOf(" ");
  // A single unbroken run longer than the limit has no boundary to use.
  cut = lastSpace > 0 ? cut.slice(0, lastSpace) : cut.slice(0, room);
  cut = cut.replace(/[\s,;:—–-]+$/u, "");
  return `${cut}…`;
}
