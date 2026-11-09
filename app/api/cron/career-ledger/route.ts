import { NextResponse } from "next/server";
import { advanceLedger } from "@/lib/career-ledger";

/**
 * Adds finished tour stops to the career ledger (lib/career-ledger) — the data
 * behind the athlete profile's Stats and Tournament Results sections.
 *
 * Runs twice an hour. Each run reads at most {@link MAX_STOPS} stops, one at a
 * time with a pause between them, and stops at the first stop that does not
 * load (the partner API is throttling; the next run carries on). The first
 * backfill (~110 stops since May 2023) therefore takes a few hours; after that
 * a run usually finds nothing to do, which costs one events read and one DB
 * read and no partner-API call.
 *
 * Each stop is read from the API once, or twice when its first pull came less
 * than a week after it ended: one fresh re-pull a week after its last day picks
 * up late results and score corrections, then the stop is locked for good
 * (Wesley, 11/9). Stops pulled during the backfill are already settled, so they
 * are locked on their first pull.
 *
 * ⚠ GENTLE BY DESIGN: a fast scan on 11/9 got most stops throttled to empty,
 * and api.pickleball.com has alerted on our traffic before (lib/pb-cache).
 * Don't raise MAX_STOPS or drop the pause to "finish the backfill faster".
 *
 * Manual run: `GET /api/cron/career-ledger/` with `Authorization: Bearer $CRON_SECRET`.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_STOPS = 10;

/** ⚠ An UNSET secret must never authorise anything — same guard as the other crons. */
function bearerMatches(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && !bearerMatches(request, secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await advanceLedger({
      maxStops: MAX_STOPS,
      budgetMs: 240_000,
      log: (msg) => console.log(`[cron/career-ledger] ${msg}`),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const error = err instanceof Error ? err.message : "ledger run failed";
    console.error(`[cron/career-ledger] ${error}`);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}
