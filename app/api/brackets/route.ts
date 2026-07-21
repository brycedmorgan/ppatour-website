import { NextResponse } from "next/server";
import { getBracketDivisions, getBracketDraw } from "@/lib/brackets-api";

/**
 * Bracket data for any tournament, built live from the PPA match feed
 * (lib/brackets-api). Works for every completed event, not just the old
 * Atlanta sample.
 *
 *   GET /api/brackets?event=<uuid>                 → { eventId, divisions[] }
 *   GET /api/brackets?event=<uuid>&division=<id>   → { division, bracket, losers }
 *     (`losers` is the losers bracket for double-elim divisions, else null)
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const event = url.searchParams.get("event");
  const division = url.searchParams.get("division");
  const headers = { "Cache-Control": "no-store" };

  if (!event) {
    return NextResponse.json({ error: "Missing event" }, { status: 400, headers });
  }

  if (!division) {
    const divisions = await getBracketDivisions(event);
    return NextResponse.json({ eventId: event, divisions }, { headers });
  }

  const draw = await getBracketDraw(event, division);
  if (!draw) {
    return NextResponse.json({ error: "Bracket not found" }, { status: 404, headers });
  }
  return NextResponse.json(
    { division: draw.division, bracket: draw.bracket, losers: draw.losers, pools: draw.pools },
    { headers },
  );
}
