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
 * The quiet state — a call that WORKED and found nothing on court.
 *
 * ⚠ THIS IS THE LINE THAT WAS COSTING US THE RATE LIMIT (9/5). The header above
 * was applied only when `matches.length > 0`, and everything else fell through
 * to `no-store` — so the most common state of a score ticker, "nothing is on
 * right now", was uncacheable. Every 15s poll from every open tab therefore
 * reached the origin, and every one of those made an upstream call. Measured on
 * Vercel's external-API dashboard mid-Nationals: `/api/ticker` was **30K of the
 * 31K calls** the site made to pickleball.com in twelve hours — 97% — with the
 * 4XX rate climbing as we were throttled. The ticker is mounted site-wide in
 * `TopBar`, so this is every visitor on every page, overnight and between
 * matches included.
 *
 * ⚠ AND IT IS STILL NOT SAFE TO PIN AN EMPTY BOARD FOR LONG — the note below is
 * the reason and it stands. So the quiet state gets the same 10s freshness and
 * DELIBERATELY NO `stale-while-revalidate`: the worst case is a 10s delay before
 * the first match of a session appears, which is inside the 15s poll the client
 * is already on, instead of the 40s (10 fresh + 30 stale) that made "No matches
 * on court right now" stick during play. What it buys is that the whole site's
 * upstream call rate is capped at ~6/min in the quiet state regardless of how
 * many people have a tab open — which is the entire point of putting a CDN in
 * front of a poll.
 */
const CACHE_CONTROL_EMPTY = "public, s-maxage=10";

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

  // A failure, or the last-good board served as a fallback, is never cached at
  // the edge — that is what the note above is about. A call that WORKED is,
  // whether or not it found matches; the empty case just gets a shorter header.
  const trustworthy = result.ok && !result.stale;
  const cacheControl = !trustworthy
    ? "no-store"
    : result.matches.length > 0
      ? CACHE_CONTROL
      : CACHE_CONTROL_EMPTY;

  return NextResponse.json(result, { headers: { "Cache-Control": cacheControl } });
}
