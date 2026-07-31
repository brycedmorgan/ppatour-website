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

export async function GET(request: Request) {
  const partner = new URL(request.url).searchParams.get("partner") ?? undefined;
  const result = await fetchLiveTicker(partner);
  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
