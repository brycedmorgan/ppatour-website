import { NextResponse } from "next/server";
import { playerHistory } from "@/lib/player-history";

/**
 * A pro's recent tour stops and matches — lib/player-history.
 *
 *   GET /api/player-history?name=<full name> → { events[], matches[] }
 *
 * A route, not a server render, because the athlete profiles are force-static
 * and ~1,100 of them build at once: assembling ten events of draws inside that
 * build is exactly the slow upstream work the note on app/athletes/[slug]/page
 * keeps out of it. The block loads after the page instead.
 *
 * Results only change when a stop finishes, so the CDN holds each name for an
 * hour and serves stale for a day while it rebuilds.
 */
export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(request: Request) {
  const name = (new URL(request.url).searchParams.get("name") ?? "").trim().slice(0, 80);
  if (!name) return NextResponse.json({ events: [], matches: [], faces: {} }, { status: 400 });
  const result = await playerHistory(name);
  // Empty can mean "no results" or "upstream 429'd on a cold pull" — the two
  // look the same from here, so an empty answer is only held for a minute.
  // `partial`: a stop's draws failed to load, so a result they played may be
  // missing. Same minute, so the next request can fill it in.
  const empty = result.events.length === 0 || Boolean(result.partial);
  return NextResponse.json(result, {
    headers: { "Cache-Control": empty ? "public, s-maxage=60" : CACHE_CONTROL },
  });
}
