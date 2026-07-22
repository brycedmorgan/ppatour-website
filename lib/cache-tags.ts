/**
 * Next.js Data Cache tags. Fetches tagged with these can be invalidated as a
 * group via `revalidateTag` (see the Vercel Cron routes in vercel.json).
 */

/** All athlete-page API pulls: stats, DUPR, division rankings, highlights. */
export const ATHLETES_CACHE_TAG = "athletes";
