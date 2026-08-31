import { NextResponse } from "next/server";
import { getBracketIndex, getBracketDraw, isEmptyDraw } from "@/lib/brackets-api";

/**
 * Bracket data for any tournament, built live from the PPA match feed
 * (lib/brackets-api). Works for every completed event, not just the old
 * Atlanta sample.
 *
 *   GET /api/brackets?event=<uuid>                 → { eventId, divisions[], stage }
 *     (`stage` is "qualifier" while the Pro Qualifier draw is the one being
 *      returned, else "main" — the panel has to say which bracket it shows)
 *   GET /api/brackets?event=<uuid>&division=<id>   → { division, bracket, losers }
 *     (`losers` is the losers bracket for double-elim divisions, else null)
 */
export const dynamic = "force-dynamic";

/**
 * BracketPanel polls every 15s per viewer, and one bracket build fans out into a
 * call per division upstream. Cached at the CDN so concurrent viewers of the
 * same draw share one refresh; a bracket only changes as matches complete, so
 * 15s of shared staleness is invisible. Errors stay uncached so a transient
 * upstream failure isn't pinned at the edge.
 */
const CACHE_CONTROL = "public, s-maxage=15, stale-while-revalidate=60";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const event = url.searchParams.get("event");
  const division = url.searchParams.get("division");
  const headers = { "Cache-Control": CACHE_CONTROL };

  if (!event) {
    return NextResponse.json({ error: "Missing event" }, { status: 400, headers: NO_STORE });
  }

  if (!division) {
    const { divisions, stage } = await getBracketIndex(event);
    // An empty list is a failed upstream call far more often than a real
    // event with no pro divisions — don't pin it at the edge.
    return NextResponse.json({ eventId: event, divisions, stage }, {
      headers: divisions.length ? headers : NO_STORE,
    });
  }

  const draw = await getBracketDraw(event, division);
  if (!draw) {
    return NextResponse.json({ error: "Bracket not found" }, { status: 404, headers: NO_STORE });
  }
  return NextResponse.json(
    { division: draw.division, bracket: draw.bracket, losers: draw.losers, pools: draw.pools },
    // Same rule for a draw with no rounds in it: never cache nothing.
    { headers: isEmptyDraw(draw) ? NO_STORE : headers },
  );
}
