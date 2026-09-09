/**
 * Alternate spellings of an athlete's name that we are willing to LINK.
 *
 * The newsroom writes the name people say; the roster stores the name on the
 * player's licence. "Chris Haworth" is the world No. 1 in men's singles and
 * `published-athletes.json` calls him **Christopher Haworth**, so every article
 * that used his everyday name resolved to nobody — no rail entry, no link.
 * Measured across the 811 migrated posts on 9/9: **"Chris Haworth" in 42 posts,
 * "Gabe Tardio" in 90**. Two of the tour's biggest names, invisible to the
 * player rail in 132 articles.
 *
 * This is the same class of problem `CURATED_TO_CANONICAL` already solves for
 * pros the two rosters spell differently (Hurricane Tyra Black / Tyra Black),
 * and it is deliberately a SEPARATE, hand-written list rather than a rule:
 *
 * ⚠ NO DERIVATION, EVER. It would be easy to generate nicknames — Christopher →
 * Chris, Gabriel → Gabe, Benjamin → Ben — and that is exactly how the paddle
 * importer read "Zoey Wang" as Chao Yi Wang (8/5 pt. 22). A generated nickname
 * that collides puts the WRONG PLAYER'S face and profile beside a sentence
 * about someone else. Every entry here is added by hand, for a name somebody
 * has actually seen in copy.
 *
 * ⚠ TWO WORDS MINIMUM, AND UNAMBIGUOUS. A first name alone identifies nobody.
 * Entries are fed through the same `add()` in `lib/article-players.ts` as the
 * real roster, so they inherit its guards: a name that resolves to two profiles
 * is dropped rather than guessed, and a slug we publish no page for is ignored.
 * Both entries below were checked against all 203 published names on 9/9 — zero
 * exact matches, zero overlapping names.
 *
 * ⚠ WHAT THIS DOES AND DOES NOT REACH. It feeds the player rail
 * (`detectAthleteMentions`) on native AND migrated articles, and inline body
 * links wherever that article already links the player. It is NOT wired into
 * `lib/score-names.ts` (the live-scores headshot matcher) or the paddle
 * importers — those match against feed data, not editorial copy, and a name
 * from a feed is not a nickname somebody typed.
 */
export type AthleteAlias = { name: string; slug: string };

/**
 * ⚠ `slug` IS THE CANONICAL PROFILE SLUG — the one `/athletes/[slug]` actually
 * prerenders — NOT necessarily the key in published-athletes.json. Tardio is
 * published as `gabriel-tardio` and his page is `gabe-tardio`, because the
 * curated roster wins (see CURATED_TO_CANONICAL). The rail tolerates either,
 * since `add()` canonicalises through `publishedProfileSlug`; `withAliasNames`
 * does NOT — it matches the slug on an already-resolved player list, so a
 * published-but-not-canonical slug silently produces a rail entry with no
 * inline link. That is exactly what happened on the first pass here.
 */
export const ATHLETE_NAME_ALIASES: AthleteAlias[] = [
  // Roster: "Christopher Haworth". 42 archived posts say "Chris Haworth".
  { name: "Chris Haworth", slug: "christopher-haworth" },
  // Roster: "Gabriel Tardio". 90 archived posts say "Gabe Tardio".
  { name: "Gabe Tardio", slug: "gabe-tardio" },
];

/**
 * The same player list, plus one entry per alias spelling, so a linkifier that
 * matches on `name` links "Chris Haworth" as readily as "Christopher Haworth".
 *
 * ⚠ LONGEST NAME FIRST. Both call sites build a regex alternation from this, and
 * an alternation is first-match-wins: a shorter name nested inside a longer one
 * would otherwise match halfway through it. Same reason `roster()` sorts.
 *
 * Aliases are only added for players already in `players` — the caller has
 * decided who this article is about, and this never widens that set.
 */
export function withAliasNames<T extends { name: string; slug: string }>(
  players: T[],
): T[] {
  const out = [...players];
  for (const alias of ATHLETE_NAME_ALIASES) {
    const base = players.find((p) => p.slug === alias.slug);
    if (base) out.push({ ...base, name: alias.name });
  }
  return out.sort((a, b) => b.name.length - a.name.length);
}
