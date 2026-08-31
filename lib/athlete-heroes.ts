/**
 * Athlete hero photography — the full-bleed action shot behind the profile hero.
 *
 * TWO SOURCES, in this order:
 *   1. Jackalope (Pro Player Central), via `PlayerOverride.heroImage` — the LIVE one.
 *      A photo swapped over there reaches the page on the next athlete-cache refresh —
 *      see the ⚠ on FRESHNESS in lib/player-overrides.ts. Not minutes. No deploy, though.
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
  /**
   * Eight more, 8/20 — the second batch of heroes the page has had since the
   * slot shipped on 8/15 with one.
   *
   * PROVENANCE: PPA Tour event photography, committed to the Jackalope Brand
   * Photo Library at `brand-assets/photos/general/` and named for the player in
   * the file itself (`hayden-patriquin-forehand.jpg`, `kate-fahey-celebration.jpg`,
   * …). The filename is the attribution — nobody decided who these people are by
   * looking at the frames, which is the rule this file exists to enforce. All
   * eight are single-subject action shots, so there is no second player in frame
   * to confuse anyway.
   *
   * ⚠ THIS IS NOT THE TOP 10. Bryce asked for the top 10 men and the top 10
   * women; three of those twenty have a named photo (Patriquin M4, Fahey W8,
   * Garnett M10) and the other five here are simply the rest of what the library
   * holds with a name on it. The remaining 17 are blocked on photography, not on
   * code — see the note at the top of this file, and do NOT close the gap by
   * cropping a doubles frame and deciding which one they are.
   *
   * `position` values were measured against the rendered band at both the desktop
   * crop (~40% of the image height survives) and the 390px mobile crop (~54% of
   * the width), the same two-crop problem documented on the ALW entry above.
   */
  /**
   * "ZIONCUP_QTRS_MXD_BEN-ALW-7" — the Zion Cup mixed-doubles quarterfinal, supplied by
   * Bryce 8/22 as "one for Ben Johns".
   *
   * ⚠ THIS IS A MIXED-DOUBLES FRAME, so two men were on that court and "the man in the
   * photo" is not by itself an answer. Three independent things say it is Ben:
   *   1. Bryce sent it and named him — the person who sent it IS provenance.
   *   2. The filename names the team, BEN-ALW, and ALW's mixed partner is Ben Johns.
   *   3. The corroborating tell: JOOLA "J" on both cap and chest, and our own paddle
   *      feed has Ben on a JOOLA Perseus Pro V 16mm. He is their flagship athlete.
   * His partner is out of shot; the only other figure near him is the net post.
   *
   * `position` measured against both crops, as above. Y=24% is what keeps the paddle,
   * the ball and his face all inside the desktop band — 30% starts shaving the paddle
   * off the top, 18% drops his legs and floats him. X only does work on mobile, where
   * 52% centres him between the net post and the left edge.
   */
  "ben-johns": {
    src: "/ppa/heroes/ben-johns.jpg",
    position: "52% 24%",
    credit: "PPA Tour",
  },
  "hayden-patriquin": {
    src: "/ppa/heroes/hayden-patriquin.jpg",
    position: "42% 20%",
    credit: "PPA Tour",
  },
  "kate-fahey": {
    src: "/ppa/heroes/kate-fahey.jpg",
    position: "42% 14%",
    credit: "PPA Tour",
  },
  "connor-garnett": {
    src: "/ppa/heroes/connor-garnett.jpg",
    position: "52% 16%",
    credit: "PPA Tour",
  },
  "hannah-blatt": {
    src: "/ppa/heroes/hannah-blatt.jpg",
    position: "58% 8%",
    credit: "PPA Tour",
  },
  "jack-sock": {
    src: "/ppa/heroes/jack-sock.jpg",
    position: "58% 68%",
    credit: "PPA Tour",
  },
  "jessie-irvine": {
    src: "/ppa/heroes/jessie-irvine.jpg",
    position: "50% 22%",
    credit: "PPA Tour",
  },
  "pablo-tellez": {
    src: "/ppa/heroes/pablo-tellez.jpg",
    position: "44% 26%",
    credit: "PPA Tour",
  },
  "tyler-loong": {
    src: "/ppa/heroes/tyler-loong.jpg",
    position: "46% 32%",
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
  if (live) return { src: ownPath(live) ?? live, position: curated?.position, credit: curated?.credit };
  return curated;
}

/**
 * A feed URL that points back at THIS site, reduced to its bare path.
 *
 * Why it matters (8/23): the page renders a "/"-prefixed src through `next/image` and
 * anything else through a plain `<img>`, because the feed can name a host next/image has
 * no remotePattern for. But the first hero anyone actually filled in Pro Player Central
 * was `https://www.ppatour.com/ppa/heroes/ben-johns.jpg` — our own file, pasted back at
 * us — and that took the plain-img branch, serving 330 KB of unoptimised JPEG as the LCP
 * image on the tour's most-visited profile instead of a ~150 KB webp.
 *
 * Pasting our own URL in is the natural thing for an editor to do, so this handles it
 * rather than asking them to remember. An off-site URL is untouched and still takes the
 * plain-img path, which is what that branch is for.
 */
function ownPath(url: string): string | null {
  const m = /^https?:\/\/(?:www\.)?ppatour\.com(\/[^\s?#]*)/i.exec(url);
  return m ? m[1] : null;
}
