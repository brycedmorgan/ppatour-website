import { NextResponse } from "next/server";
import {
  ATLANTA_EVENT_ID,
  getSampleDraw,
  getSampleDivisions,
} from "@/lib/bracket-sample";

/**
 * Bracket data proxy. The single swap point for the real feed: today it serves
 * the representative Atlanta sample; once apps/brackets exposes its JSON (or the
 * draw API opens up), this route fetches + adapts that into the same shape and
 * nothing on the client changes.
 *
 *   GET /api/brackets?event=<uuid>                 → { eventId, divisions[] }
 *   GET /api/brackets?event=<uuid>&division=<id>   → { division, bracket, losers }
 *     (`losers` is the losers bracket for double-elim divisions, else null)
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const event = url.searchParams.get("event") || ATLANTA_EVENT_ID;
  const division = url.searchParams.get("division");
  const headers = { "Cache-Control": "no-store" };

  const divisions = getSampleDivisions();

  if (!division) {
    return NextResponse.json({ eventId: event, divisions }, { headers });
  }

  const draw = getSampleDraw(division);
  const div = divisions.find((d) => d.id === division) ?? null;
  if (!draw || !div) {
    return NextResponse.json({ error: "Bracket not found" }, { status: 404, headers });
  }
  return NextResponse.json(
    { division: div, bracket: draw.winners, losers: draw.losers },
    { headers },
  );
}
