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
