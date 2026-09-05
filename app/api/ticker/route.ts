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
 * The degraded state — upstream is failing, and we are serving the last-good
 * board that {@link fallbackFor} kept.
 *
 * ⚠ THIS WAS THE LAST NO-STORE PATH AND IT BECAME THE DOMINANT ONE (9/5). With
 * the earlier two fixes in, the endpoint still ran at ~16 upstream calls/min
 * with a 27.5% error rate, and the reason is that every one of those failures
 * answered `no-store`: the CDN could shield nothing, so every 15s poll from
 * every open tab reached origin, and each instance re-attempted upstream as
 * soon as its cooldown lapsed. That multiplies by instance count rather than
 * being collapsed at the edge — precisely backwards, because the moment
 * upstream starts failing is the moment we most need the edge in front of it.
 *
 * ⚠ AND THIS IS NOT THE THING THE NOTE ABOVE FORBIDS. What must never be pinned
 * is a claim we cannot stand behind — a 429 rendered as "No matches on court
 * right now". A stale board is the opposite: it is real match data we served
 * seconds ago, carrying `stale: true` so the client knows what it has. Holding
 * that at the edge for 10s is the same answer every viewer would get anyway,
 * served once instead of once per tab. The genuinely empty failure — no
 * last-good board to fall back on — is still `no-store`, because that one WOULD
 * be publishing "nothing is on" off the back of an outage.
 *
 * No stale-while-revalidate, so a degraded board is never held past its 10s.
 */
const CACHE_CONTROL_STALE = "public, s-maxage=10";

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

  // A call that WORKED is cacheable whether or not it found matches; the empty
  // case just gets a shorter header. A DEGRADED answer is cacheable too, but
  // only when we have a real last-good board to serve — see the notes above.
  // Nothing else is: an outage with no data behind it stays no-store.
  const fresh = result.ok && !result.stale;
  const cacheControl = fresh
    ? result.matches.length > 0
      ? CACHE_CONTROL
      : CACHE_CONTROL_EMPTY
    : result.matches.length > 0
      ? CACHE_CONTROL_STALE
      : "no-store";

  return NextResponse.json(result, { headers: { "Cache-Control": cacheControl } });
}
