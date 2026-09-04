/**
 * Paddle-update requests that have reached the website ahead of the data.
 *
 * ⚠ THIS IS A STOPGAP LAYER AND IT IS BUILT TO RETIRE ITSELF. Jackalope
 * (Pro Player Central → Paddles & Watch) is the live source of truth for what a
 * pro plays — `lib/player-overrides.ts` — and the static broadcast masterlist
 * (`lib/athlete-paddles.ts`) is the fallback behind it. Neither can be edited
 * from this repo, so when the event team sends a paddle change straight to the
 * website there is no honest place to put it: the page would keep publishing the
 * old brand until somebody edits Jackalope.
 *
 * So an entry here wins over both — but ONLY while the paddle it was written to
 * replace is still the one on the page. Each row names that paddle in
 * `supersedes`, and the moment Jackalope says anything else (the real fix, or a
 * later change we haven't been told about) the row stops matching and the feed
 * wins again. That is the whole point: a hardcoded paddle that outlives the data
 * it was patching is a stale endorsement — a commercial claim about a brand
 * relationship — which is exactly what the masterlist replaced `quickInfo.paddle`
 * to stop (8/5 pt. 21).
 *
 * ⚠ SO EVERY ROW HERE IS ALSO AN OPEN TICKET. Ask Dillon Segur / Liv Borski to
 * make the same edit in Jackalope, and delete the row once it lands — it will
 * already have stopped applying.
 */

export type PaddleUpdate = {
  /** Display string: brand + model, exactly as the requester wrote it. */
  paddle: string;
  /** What to search Pickleball Central for, when `buyUrl` is not set. */
  searchTerm: string;
  /**
   * The manufacturer on its own, for the paddle's Product structured data.
   * Never derived by splitting the display string — a model name can lead with
   * a word that isn't the brand.
   */
  brand: string;
  /**
   * Where "Buy This Paddle" goes when Pickleball Central does not carry it.
   * Unset = the normal PBC route. Set this only to a brand-supplied product
   * page: a PBC search that returns no product is a buy button that finds
   * nothing.
   */
  buyUrl?: string;
  /**
   * A transparent cut-out of the NEW paddle, for the callout.
   *
   * ⚠ IT RIDES ON THIS ROW RATHER THAN LIVING IN `lib/paddle-images.ts`, AND
   * THAT IS THE WHOLE REASON IT IS HERE. That file's two maps are both wrong
   * homes for a stopgap photo: `CUTOUTS` is keyed on the paddle NAME, and a
   * name is not always a picture — the MEHAU S5 AIRPOOM ships in six
   * colourways (Vanguard Steed, Apex Stag, Sage Rhino, Lucky Magpie, Dolphin
   * Leap, Cosmos Elephant) and the display string names none of them, so an
   * entry there would publish one pro's colourway on every other pro playing
   * that model. And `BY_SLUG` is keyed on the athlete and consulted before the
   * paddle name, so a photo left there would keep rendering after this row
   * stopped applying — a photo of a paddle the pro no longer plays, which is
   * the exact stale-endorsement failure this module is built to avoid.
   *
   * Here it retires when the row does. Once Jackalope carries the paddle it can
   * carry the photo too (`image` on the feed), and the asset stays on disk
   * either way.
   */
  image?: { src: string; width: number; height: number };
  /**
   * The paddle this replaces, as the page is publishing it today. The update
   * applies ONLY while that is still the effective paddle — see the header.
   */
  supersedes: string;
  /** Who asked, and when. */
  note: string;
};

const BY_SLUG: Record<string, PaddleUpdate> = {
  "adam-harvey": {
    paddle: "MEHAU S5 AIRPOOM™ Aerodynamic Pickleball Paddle",
    searchTerm: "MEHAU S5 AIRPOOM",
    brand: "MEHAU",
    // Not sold on Pickleball Central. MEHAU supplied the product page, so the
    // buy button goes there rather than to a PBC search with no result.
    buyUrl:
      "https://mehaupickleball.com/products/mehau-s5-airpoom-aerodynamic-pickleball-paddle",
    supersedes: "Luzz PRO-CANNON",
    note: "Event team via Wesley, 8/13. Jackalope + the broadcast masterlist both still say Luzz PRO-CANNON.",
  },
  "hunter-johnson": {
    paddle: "MEHAU S5 AIRPOOM™ Aerodynamic Pickleball Paddle",
    searchTerm: "MEHAU S5 AIRPOOM",
    brand: "MEHAU",
    // Same paddle, same reason as Adam Harvey above: not sold on Pickleball
    // Central, so the buy button goes to MEHAU's own product page rather than
    // to a PBC search that returns nothing.
    buyUrl:
      "https://mehaupickleball.com/products/mehau-s5-airpoom-aerodynamic-pickleball-paddle",
    // The Sage Rhino colourway — the shot MEHAU supplied for him. The colourway
    // is in the filename because the display string above does not carry it and
    // five other colourways of this paddle exist; see `image` on the type.
    image: { src: "/ppa/paddles/mehau-s5-airpoom-sage-rhino.png", width: 207, height: 480 },
    supersedes: "Hit Pickleball Hand Cannon",
    note: "Event team via Wesley, 9/3. Jackalope still says Hit Pickleball Hand Cannon; he is not in the broadcast masterlist at all.",
  },
};

/** Loose compare — spacing and case only; the model string itself must match. */
function same(a: string, b: string): boolean {
  return a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * The pending update for this pro, or null.
 *
 * @param slug     the athlete page being rendered
 * @param current  the paddle the page WOULD publish (Jackalope first, masterlist
 *                 second). Null — the pro has no paddle from either source — is
 *                 never overridden here: whether a pro shows a paddle at all
 *                 stays with those two sources (Wesley, 8/5).
 */
export function paddleUpdateFor(slug: string, current: string | null | undefined): PaddleUpdate | null {
  const update = BY_SLUG[slug];
  if (!update || !current) return null;
  return same(current, update.supersedes) ? update : null;
}
