import { publishedAthletes } from "@/lib/published-athletes";
import { getWprIndex } from "@/lib/rankings-api";

/**
 * Duplicate athlete-profile detection.
 *
 * The published roster (`lib/data/published-athletes.json`) is a scrape of
 * ppatour.com's WordPress profiles, and WordPress mints a `-2` slug whenever a
 * second post is created for a name that already exists. Four of those
 * duplicate slugs shipped as real pages: `/athletes/elsie-hendershot-2`,
 * `danna-funaro-2`, `ella-cosma-2` and `edward-perez-2` — each alongside the
 * canonical page, and each WINNING on /athletes, because the roster grid is
 * built from the scrape. The duplicate card carried the bio but no rank or
 * headshot (the live WPR index is keyed by the API's `player_slug`, which the
 * `-2` form never matches), and it linked to the thinner of the two pages.
 * Those four are fixed in the JSON itself — see the note there.
 *
 * ⚠ THE SUFFIX IS NOT THE TEST, AND THIS IS THE WHOLE TRAP. A numeric suffix
 * means "WordPress needed to disambiguate", nothing more, and it appears on
 * both sides of the distinction:
 *
 *   · `luana-stanciu-1` IS the Partner API's own canonical slug for Luana
 *     Stanciu (world No. 91) — there is no `luana-stanciu` on the board at all.
 *     Stripping her suffix would break the page it was meant to fix.
 *   · `ben-johns-3` (No. 682) and `patrick-smith-10` (No. 1192) are REAL,
 *     DIFFERENT PLAYERS who happen to share a name with a higher-ranked pro.
 *     Both are on the board in their own right; collapsing them would delete a
 *     person.
 *
 * So the arbiter is the board, never the string: a published slug is a
 * duplicate only when the board does not list it AND lists exactly one player
 * with that name. "Exactly one" is what protects the two Ben Johnses — a name
 * the board carries twice is ambiguous, and we leave ambiguity alone.
 *
 * ⚠ Degrades to a no-op, deliberately. With no token, a 429, or an athlete
 * outside the top {@link getWprIndex} rows of their board, the maps come back
 * empty and every profile renders exactly as it does today. A duplicate
 * surviving is a worse page; a wrong rewrite is a wrong person, so the fallback
 * has to be "change nothing". `scripts/audit-athlete-slugs.mjs` is the check
 * that catches what this can't see at render time.
 */

/** Accent- and punctuation-insensitive name key, matching lib/ranking-filters. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type SlugResolution = {
  /** Duplicate published slug → the canonical slug the site publishes instead. */
  toCanonical: Record<string, string>;
  /** Canonical slug → the published record's own (duplicate) slug, so the
   *  canonical page can still read the scraped bio and quick facts. */
  publishedKeyFor: Record<string, string>;
};

const EMPTY: SlugResolution = { toCanonical: {}, publishedKeyFor: {} };

/**
 * Which published slugs are duplicates of a canonical profile, per the live WPR
 * boards. Cheap: reads the same cached board pages /athletes already loads.
 */
export async function resolveAthleteSlugs(): Promise<SlugResolution> {
  const index = await getWprIndex();
  const boardSlugs = Object.keys(index);
  if (boardSlugs.length === 0) return EMPTY;

  // name → every board slug carrying it. A name with more than one is two
  // different players and is never collapsed.
  const byName = new Map<string, string[]>();
  for (const entry of Object.values(index)) {
    const key = normalizeName(entry.name);
    const list = byName.get(key);
    if (list) list.push(entry.slug);
    else byName.set(key, [entry.slug]);
  }

  const toCanonical: Record<string, string> = {};
  const publishedKeyFor: Record<string, string> = {};
  for (const p of publishedAthletes) {
    // The board knows this slug: it is canonical whatever it looks like.
    if (index[p.slug]) continue;
    const matches = byName.get(normalizeName(p.name));
    if (matches?.length !== 1) continue;
    const canonical = matches[0];
    if (canonical === p.slug) continue;
    // Another published record already occupies the canonical slug — that one
    // is the primary and this one is the duplicate to fold into it.
    toCanonical[p.slug] = canonical;
    publishedKeyFor[canonical] = p.slug;
  }
  return { toCanonical, publishedKeyFor };
}
