import { athletes } from "@/lib/athletes";
import { publishedAthletes, publishedProfileSlug } from "@/lib/published-athletes";

/**
 * Finds the athletes an article actually names, so "Players in This Story" is
 * driven by the story rather than by whoever remembered to tag it.
 *
 * ⚠ WHY THIS EXISTS. The rail was real, not demo data — but for the 848
 * migrated posts it read ONLY WordPress's player categories, and those cover
 * less than half the archive. Measured on the live data:
 *
 *   - 385 of 811 news posts carry a player tag. The other 426 render no rail.
 *   - 218 of those 426 name a published athlete in the headline or body — a
 *     Ben Johns story with no way to reach Ben Johns.
 *   - 314 of the 385 that ARE tagged name additional athletes the tag list
 *     leaves out, so even a tagged article under-reports its own cast.
 *
 * Detection closes all three: the tags stay (they are editorial intent and
 * lead the rail) and mentions are unioned in behind them.
 *
 * ⚠ THE ROSTER IS PROFILES WE PUBLISH, NEVER THE FULL RANKING BOARD. The WPR
 * boards carry 2,075 players and ~22 duplicate names — two Ben Johnses, world
 * No. 1 and world No. 682. Detecting against the board would put a linked
 * headshot of the wrong human being on a story about the right one. The
 * published roster + curated list is 179 profiles with zero duplicate names,
 * verified, and every one of them has a bio and a page worth landing on.
 */

type Candidate = { name: string; slug: string };

/** Fold accents + curly apostrophes so "Estee" finds "Estée Widdershoven". */
function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[‘’]/g, "'");
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let cachedRoster: Candidate[] | null = null;
let cachedRe: RegExp | null = null;

/**
 * Every name we are willing to link, mapped to the slug `/athletes/[slug]`
 * actually prerenders.
 *
 * Both name sets are folded in on purpose: the published record and the
 * curated record can spell the same person differently, and the curated
 * spelling is usually the one the newsroom writes. "Hurricane Tyra Black" is
 * the published name; every article says "Tyra Black".
 */
function roster(): Candidate[] {
  if (cachedRoster) return cachedRoster;
  const bySlug = new Map<string, string>(); // folded name → profile slug
  const ambiguous = new Set<string>();

  const add = (name: string, slug: string) => {
    const profile = publishedProfileSlug(slug);
    // No page, no link. The archive names plenty of people we don't publish.
    if (!profile || !name) return;
    // A first name alone is never enough to identify a player.
    if (name.trim().split(/\s+/).length < 2) return;
    const key = fold(name).toLowerCase();
    const seen = bySlug.get(key);
    /**
     * ⚠ One name, two people → link neither.
     *
     * This is the 8/5 duplicate-profile ruling applied to prose: ambiguity is
     * left alone, because a rail that links the wrong player is worse than a
     * rail that omits a right one. Zero names collide today; this is the guard
     * that keeps it true as the roster grows.
     */
    if (seen && seen !== profile) {
      ambiguous.add(key);
      return;
    }
    bySlug.set(key, profile);
  };

  for (const a of publishedAthletes) add(a.name, a.slug);
  for (const a of athletes) add(a.name, a.slug);
  for (const key of ambiguous) bySlug.delete(key);

  // Longest first so "Anna Leigh Waters" wins the alternation over a nested
  // shorter name rather than matching it halfway.
  cachedRoster = [...bySlug.entries()]
    .map(([name, slug]) => ({ name, slug }))
    .sort((a, b) => b.name.length - a.name.length);
  return cachedRoster;
}

/**
 * One alternation over the whole roster, built once per process.
 *
 * The boundaries are letter/number lookarounds rather than `\b` so a trailing
 * possessive still matches ("Ben Johns' partner") while a longer name does not
 * ("Ben Johnson" must never resolve to Ben Johns).
 */
function mentionRe(): RegExp {
  if (!cachedRe) {
    const alt = roster().map((c) => escapeRe(c.name)).join("|");
    cachedRe = new RegExp(`(?<![\\p{L}\\p{N}])(${alt})(?![\\p{L}\\p{N}])`, "giu");
  }
  // Shared across calls, and `g` makes it stateful — reset or the second
  // article on a build resumes scanning from where the first one stopped.
  cachedRe.lastIndex = 0;
  return cachedRe;
}

export type Mention = { slug: string; count: number; firstIndex: number };

/**
 * Athletes named in `text`, ranked by how central they are to it.
 *
 * Ordered by mention count, then by first appearance. That ordering is what
 * makes the rail useful on a season wrap that names thirty players: the two
 * the piece is actually about sit at the top, not whoever happens to be
 * alphabetically lucky.
 */
export function detectAthleteMentions(text: string): Mention[] {
  if (!text) return [];
  const folded = fold(text);
  const bySlug = new Map<string, Mention>();
  const lookup = new Map(roster().map((c) => [c.name.toLowerCase(), c.slug]));

  const re = mentionRe();
  let m: RegExpExecArray | null;
  while ((m = re.exec(folded)) !== null) {
    const slug = lookup.get(m[1].toLowerCase());
    if (!slug) continue;
    const hit = bySlug.get(slug);
    if (hit) hit.count += 1;
    else bySlug.set(slug, { slug, count: 1, firstIndex: m.index });
  }

  return [...bySlug.values()].sort(
    (a, b) => b.count - a.count || a.firstIndex - b.firstIndex,
  );
}
