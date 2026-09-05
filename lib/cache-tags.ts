/**
 * Next.js Data Cache tags. Fetches tagged with these can be invalidated as a
 * group via `revalidateTag` (see the Vercel Cron routes in vercel.json).
 */

/** All athlete-page API pulls: stats, DUPR, division rankings, highlights. */
export const ATHLETES_CACHE_TAG = "athletes";

/** Tournament details (live-page header) — API_v2_Tourney_GetDetails. */
export const TOURNAMENT_DETAILS_CACHE_TAG = "tournament-details";

/** Registration counts (event Get Involved) — PT.com registrations summary. */
export const REGISTRATIONS_CACHE_TAG = "registrations";

/** Replay video playlists (event pages) — YouTube Data API. */
export const REPLAYS_CACHE_TAG = "replays";

/**
 * The World Pickleball Rankings boards (`partner_rankings`), kept SEPARATE from
 * {@link ATHLETES_CACHE_TAG} on purpose.
 *
 * ⚠ THE BOARDS USED TO RIDE ON THE ATHLETES TAG, AND THAT IS WHAT MADE A SINGLE
 * JACKALOPE EDIT EXPENSIVE. `/api/revalidate-athletes` is called by Pro Player
 * Central on EVERY player save (8/23), and it purges its whole tag — so editing
 * one pro's paddle dropped all ten cached board pages, and the next render of
 * any athlete page, news article, /athletes or /europe had to re-page both
 * boards from upstream. A 24-player import (the Europe portraits, 9/4) meant 24
 * of those storms in a row.
 *
 * A player record changing in Jackalope does not change the rankings, so the two
 * no longer share a tag. The boards roll themselves over daily anyway — the
 * upstream URL carries `rank=<today>` — so nothing needs to purge this on a
 * schedule; it exists so the boards CAN be purged deliberately.
 */
export const RANKINGS_CACHE_TAG = "rankings";
