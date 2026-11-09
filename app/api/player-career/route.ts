import { NextResponse } from "next/server";
import { playerCareer } from "@/lib/player-career";

/**
 * A pro's whole PPA career — lib/player-career, from the stored career ledger.
 *
 *   GET /api/player-career?name=<full name> → { events[], since, builtAt }
 *
 * A route, not part of the profile render, for the reason /api/player-history
 * gives: the profiles are force-static and ~1,100 build at once. The answer
 * only changes when a stop finishes and the ledger cron adds it, so the CDN
 * holds each name for six hours and serves stale for a day. An empty answer
 * (ledger not built yet, or still backfilling) is held for five minutes.
 */
export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, s-maxage=21600, stale-while-revalidate=86400";

export async function GET(request: Request) {
  const name = (new URL(request.url).searchParams.get("name") ?? "").trim().slice(0, 80);
  if (!name) return NextResponse.json({ events: [], since: null, builtAt: null }, { status: 400 });
  const result = await playerCareer(name);
  return NextResponse.json(result, {
    headers: { "Cache-Control": result.events.length ? CACHE_CONTROL : "public, s-maxage=300" },
  });
}
