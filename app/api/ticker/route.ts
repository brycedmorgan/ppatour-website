import { NextResponse } from "next/server";
import { fetchLiveTicker } from "@/lib/ticker-api";

// Server-side proxy so the browser can poll live scores without ever seeing
// the PB-API-TOKEN. Optional ?partner= override (e.g. "PPA Australia", or the
// dev tournament's partner later); defaults to the first partner that's live.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const partner = new URL(request.url).searchParams.get("partner") ?? undefined;
  const result = await fetchLiveTicker(partner);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
