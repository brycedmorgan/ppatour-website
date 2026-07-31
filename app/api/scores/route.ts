import { NextResponse } from "next/server";
import { getScores } from "@/lib/scores-api";
import { ATLANTA_EVENT_ID } from "@/lib/bracket-sample";

/**
 * Scores proxy — every played match for a tournament's pro divisions, flattened
 * for the client to group by date + division. Server-side so the browser never
 * sees the PB-API-TOKEN.
 *
 *   GET /api/scores?event=<uuid> → { tournamentId, divisions[], matches[] }
 */
export const dynamic = "force-dynamic";

/**
 * ScoresBoard polls every 30s per viewer. Building one response costs many
 * upstream calls (one per pro division), so this must not be `no-store` — the
 * CDN collapses all viewers of an event onto one refresh per 30s window, and
 * stale-while-revalidate means nobody waits for that rebuild.
 */
const CACHE_CONTROL = "public, s-maxage=30, stale-while-revalidate=60";

export async function GET(request: Request) {
  const event = new URL(request.url).searchParams.get("event") || ATLANTA_EVENT_ID;
  const result = await getScores(event);
  return NextResponse.json(result, { headers: { "Cache-Control": CACHE_CONTROL } });
}
