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
