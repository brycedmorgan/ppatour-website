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

/**
 * Live match data — the ticker window, the scores board and the brackets, all
 * of which read `homepage_score_ticker` or `tournament_events`.
 *
 * ⚠ THIS TAG EXISTS TO MAKE A SHARED CACHE PURGEABLE, NOT TO SCHEDULE ONE.
 * Nothing in vercel.json purges it and nothing should: these entries carry
 * 10-30s revalidate windows and roll themselves over continuously. It is here
 * so a human can drop every live-data entry at once — the case that matters is
 * an upstream correction mid-tournament (a match voided, a score amended),
 * where waiting out even a 30s window on every edge is the wrong answer.
 */
export const LIVE_SCORES_CACHE_TAG = "live-scores";

/**
 * Finished tournaments: draws, scores and pro fields that can no longer change.
 *
 * ⚠ IT EXISTS BECAUSE THE OTHER TAGS ARE PURGED ON A SCHEDULE AND THIS DATA MUST
 * NOT BE. Wesley, 9/17: "completed tournaments should never trigger an API call
 * again because the tournament is over and the content will not change again."
 * Entries for a settled tournament carry a one-year window, so the only thing
 * that could still make them re-fetch is a tag purge — and
 * {@link TOURNAMENT_DETAILS_CACHE_TAG}, which lib/event-field.ts used to use, is
 * purged by the daily `/api/revalidate-content` cron. Left on that tag, every
 * finished event would have re-read its whole pro field once a day forever.
 *
 * ⚠ NOTHING PURGES THIS ON A SCHEDULE, AND NOTHING SHOULD. Adding it to the cron
 * in app/api/revalidate-content/route.ts would silently undo the whole point.
 *
 * The escape hatch is deliberate and manual: `/api/revalidate-content?tag=
 * finished-results` with the cron secret, for the one case that justifies it —
 * a result corrected after the fact (a voided match, an amended score, a late
 * DQ). See lib/live-cache-window.ts.
 */
export const FINISHED_RESULTS_CACHE_TAG = "finished-results";
