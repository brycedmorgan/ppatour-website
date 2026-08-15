/**
 * Athlete hero photography — the full-bleed action shot behind the profile hero.
 *
 * TWO SOURCES, in this order:
 *   1. Jackalope (Pro Player Central), via `PlayerOverride.heroImage` — the LIVE one.
 *      A photo swapped over there reaches the page within the ISR window, no deploy.
 *      ⚠ Jackalope has no per-player photo tagging yet (its Brand Photo Library is
 *      keyed by VENUE — the `type:'athletes'` rows are "Player walk-in" filed under
 *      mission-hills-ca, mckinney-tx, …). So the field is wired and reads null for
 *      every pro today. Tagging heroes to players over there is what lights it up.
 *   2. `HEROES_BY_SLUG` below — a curated in-repo fallback, one entry per pro.
 *
 * No hero from either source is the normal case and renders the plain navy band the
 * page has always had. A hero is never guessed from a headshot or an event photo:
 * a wide crowd shot behind a player's name reads as "this is them", and on 179
 * profiles that is a claim about a person.
 */

export type AthleteHero = {
  /** Path under /public, or an absolute URL from the feed. */
  src: string;
  /**
   * `object-position` for the crop. A hero band is much wider than it is tall, so
   * the default centre crop usually cuts the player out. Written as a CSS value.
   */
  position?: string;
  /** Photo credit, rendered small in the corner when set. */
  credit?: string;
};

/**
 * ⚠ ONE ENTRY PER PRO, AND THE PHOTO MUST BE OF THAT PRO. `action-waters-bright.jpg`
 * is Anna Leigh Waters and Anna Bright against Parenteau/Jardim — Waters is the
 * player at the kitchen line, upper-left of centre, which is what `position` frames.
 */
const HEROES_BY_SLUG: Record<string, AthleteHero> = {
  "anna-leigh-waters": {
    src: "/ppa/action-waters-bright.jpg",
    position: "52% 22%",
    credit: "PPA Tour",
  },
};

/**
 * The hero for a pro: the live Jackalope photo if there is one, else the curated
 * fallback, else null. `feedHero` is `PlayerOverride.heroImage`.
 */
export function athleteHeroFor(
  slug: string,
  feedHero?: string | null,
): AthleteHero | null {
  const curated = HEROES_BY_SLUG[slug] ?? null;
  const live = (feedHero || "").trim();
  // The feed carries a URL only — keep the curated crop when we have one for this
  // pro, since a centre crop of a wide action shot usually loses the player.
  if (live) return { src: live, position: curated?.position, credit: curated?.credit };
  return curated;
}
