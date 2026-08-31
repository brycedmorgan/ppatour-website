import { NextResponse } from "next/server";
import { fetchLiveTicker } from "@/lib/ticker-api";

// Server-side proxy so the browser can poll live scores without ever seeing
// the PB-API-TOKEN. Optional ?partner= override (e.g. "PPA Australia", or the
// dev tournament's partner later); defaults to the first partner that's live.
export const dynamic = "force-dynamic";

/**
 * The site-wide ScoreTicker polls this every 15s from every open tab, and it was
 * `no-store` — so N visitors meant N origin hits, each landing on a possibly
 * cold instance whose in-process ticker cache was empty, i.e. an upstream call.
 * That is what throttles us. The CDN now answers most polls: 10s fresh, then
 * stale-while-revalidate serves the last payload instantly while one background
 * request refreshes it. Live scores stay live (10s < the 15s poll) and the
 * upstream call rate is capped at ~6/min for the whole site regardless of
 * traffic. `s-maxage` is shared-cache only, so browsers still never store it.
 */
const CACHE_CONTROL = "public, s-maxage=10, stale-while-revalidate=30";

/**
 * ⚠ A FAILED OR EMPTY ANSWER IS NEVER PINNED AT THE EDGE.
 *
 * The header above is right for real scores and wrong for everything else. An
 * upstream timeout used to resolve to `{ matches: [] }` with a 200 and this
 * cache header on it, so ONE bad call published "No matches on court right now"
 * to every visitor for up to 40 seconds (10s fresh + 30s stale-while-
 * revalidate) in the middle of Nationals — and the next poll got the cached
 * copy rather than a retry, which is why it lasted rather than blinking.
 *
 * Same call `/api/brackets` makes for an empty draw. An empty board is also
 * no-store even when the call succeeded: it costs one upstream request to
 * recover the moment play resumes, and pinning "nothing is on" is the more
 * expensive mistake.
 */
export async function GET(request: Request) {
  const partner = new URL(request.url).searchParams.get("partner") ?? undefined;
  const result = await fetchLiveTicker(partner);
  const cacheable = result.ok && !result.stale && result.matches.length > 0;
  return NextResponse.json(result, {
    headers: { "Cache-Control": cacheable ? CACHE_CONTROL : "no-store" },
  });
}
