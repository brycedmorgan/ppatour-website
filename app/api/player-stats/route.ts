import { NextResponse } from "next/server";
import { isUuid, pbPlayerStats } from "@/lib/pb-player-stats";

/**
 * A pro's PPA Tour stats from pickleball.com's stats engine (lib/pb-player-stats).
 *
 *   GET /api/player-stats?uuid=<pickleball.com player uuid> → PbPlayerStats | null
 *
 * A route, like /api/player-career, because the profiles are force-static and
 * ~1,100 build at once; and because the upstream answer is ~890 KB, so the CDN
 * caching this cut-down copy is the only cache (see the lib's header). Six
 * hours fresh, a day stale. A failed or empty answer is held five minutes, and
 * the profile falls back to counting stats from the career ledger.
 */
export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, s-maxage=21600, stale-while-revalidate=86400";

export async function GET(request: Request) {
  const uuid = (new URL(request.url).searchParams.get("uuid") ?? "").trim();
  if (!isUuid(uuid)) return NextResponse.json(null, { status: 400 });
  const stats = await pbPlayerStats(uuid);
  return NextResponse.json(stats, {
    headers: { "Cache-Control": stats ? CACHE_CONTROL : "public, s-maxage=300" },
  });
}
