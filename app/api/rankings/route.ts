import { NextResponse } from "next/server";
import { getFullRankings, toBoardDivisions } from "@/lib/rankings-api";

/**
 * The COMPLETE World Pickleball Rankings boards, as JSON.
 *
 * /rankings used to render every ranked pro — ~2,000 rows — into its HTML, and
 * that markup IS the page: 2.04 MB, 18,646 DOM nodes, DOMContentLoaded 5.3s
 * even after the 8/1 per-row diet. The page now server-renders the top 25 of
 * each board and asks this route for the rest once it has loaded, so the wait
 * happens beside a skeleton instead of in front of a blank tab.
 *
 * Same data, same server helper, same board cache — this is a transport change,
 * not a data one. In particular it does NOT add an upstream call: getFullRankings
 * reads the 24h Data Cache (tagged, refreshed by the athletes cron) that the
 * /rankings build and /leaderboards already populate.
 */
export const dynamic = "force-dynamic";

/**
 * ⚠ WITHOUT THIS, `force-dynamic` ABOVE SILENTLY DISABLES THE DATA CACHE FOR
 * EVERY FETCH THIS ROUTE MAKES, AND THAT IS WHY `partner_rankings` RAN HOT
 * (9/5). Next's own words: `dynamic = "force-dynamic"` is "equivalent to …
 * setting the option of every fetch() request to { cache: 'no-store',
 * next: { revalidate: 0 } }" and to `fetchCache = 'force-no-store'`. The FORCE
 * in that name is literal — it overrides the `revalidate` and `tags` that
 * `lib/rankings-api.ts` passes on each board page, so the 24h Data Cache
 * entries this route thinks it is reading were never written.
 *
 * The cost is not one call. Assembling a board walks up to ten pages per
 * gender, and /rankings fetches this route from the browser on every visit, so
 * every uncached assembly was ~10 upstream requests. Measured on production
 * before the fix: two back-to-back forced-origin requests took 7.3s and 8.1s,
 * the second no faster than the first — i.e. nothing the first one fetched was
 * retained.
 *
 * `default-cache` keeps the route itself dynamic (it must always run) while
 * letting each fetch's own cache options be respected again.
 */
export const fetchCache = "default-cache";


/**
 * Rankings move on event results, not on the minute, so the CDN answers
 * essentially every hit. `s-maxage` is shared-cache only: browsers re-ask on a
 * reload and get a fresh-enough edge copy, and stale-while-revalidate means a
 * cold-ish edge never makes a visitor wait on the origin. Matches the page's
 * own `revalidate = 300`, so the seed rows and the full board can't disagree by
 * more than one revalidation window.
 */
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=3600";

export async function GET() {
  const ranking = await getFullRankings();

  // Configured but the feed failed. Never cache that at the edge — a five-minute
  // pin on an empty board would outlast most outages. The client keeps its
  // server-rendered top 25 and says the rest didn't load.
  if (ranking.source === "unavailable") {
    return NextResponse.json(
      { divisions: [], source: ranking.source },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { divisions: toBoardDivisions(ranking.divisions), source: ranking.source },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
