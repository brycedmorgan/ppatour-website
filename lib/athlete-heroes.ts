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
 * ⚠ ONE ENTRY PER PRO, AND THE PHOTO MUST BE OF THAT PRO — a hero is the one image on
 * the site that asserts "this is them". Files live in `public/ppa/heroes/` named for the
 * slug, so the pairing is legible from the filesystem and a mismatch is obvious.
 *
 * ⚠ AND MOST TOUR PHOTOGRAPHY IS DOUBLES, so "who is this" is a real question rather than
 * a formality. Attribute from provenance — the source filename, or the person who sent
 * it — never from looking at the frame and deciding. Both women in a PPA women's doubles
 * final are blonde often enough that a confident guess is exactly how the wrong athlete's
 * face ends up on someone's own page.
 *
 * Source encode: 2048px wide, mozjpeg q64, matching `public/ppa/action-waters-bright.jpg`
 * (2048x1365, 280 KB) and Wesley's event photography.
 */
const HEROES_BY_SLUG: Record<string, AthleteHero> = {
  /**
   * "THE MASTERS_ALW X AB_WD FINAL-3" — the Carvana Masters women's doubles final,
   * supplied by Bryce 8/15. ALW is the player in frame; her partner Anna Bright is out
   * of shot bar the JOOLA paddle at the left edge, which is the corroborating tell (ALW
   * plays a Franklin, Bright a JOOLA).
   *
   * ⚠ `position` is measured, not eyeballed, and it has to serve two very different
   * crops. Desktop shows the full width and slices ~48% of the height, so Y frames her
   * head through her hips. Mobile is the opposite: at 390x502 the scaled image is
   * 754x502, so the height fits exactly and only X does any work — 53% centres her.
   */
  "anna-leigh-waters": {
    src: "/ppa/heroes/anna-leigh-waters.jpg",
    position: "53% 52%",
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
