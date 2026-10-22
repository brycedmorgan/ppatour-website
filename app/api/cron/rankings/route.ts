import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { writeStored } from "@/lib/pb-cache";
import { WPR_SNAPSHOT_KEY, WPR_SNAPSHOT_TAG } from "@/lib/wpr-snapshot";
import { fetchWprSnapshot, describeSnapshot } from "@/lib/wpr-snapshot-core.mjs";

/**
 * Daily World Pickleball Rankings refresh — re-reads every board once a day and
 * stores the snapshot in Postgres, where lib/wpr-snapshot.ts picks it up.
 *
 * ⚠ THIS REPLACES `/api/cron/rebuild`, WHICH NEVER WORKED (9/28). That route
 * pinged a Vercel Deploy Hook so `prebuild` would regenerate the bundled JSON,
 * on the theory that "a cron cannot write the snapshot itself" — true of the
 * read-only filesystem, not of the database. `DEPLOY_HOOK_URL` was set on 9/5
 * and in 23 days not one production deploy came from it, so the rankings were
 * only ever as fresh as the last code push. On 9/28 that meant a board captured
 * the previous afternoon, at a moment pickleball.com was returning numbers it no
 * longer returns for the same date.
 *
 * ⚠ IT BYPASSES THE PER-URL CACHE ON PURPOSE. The first build of a day writes
 * the board pages to `api_cache` for 24h; reading them back here would re-store
 * whatever that build happened to catch. The point of this job is a fresh read.
 * It costs 16 sequential `partner_rankings` calls a day.
 *
 * ⚠ A FAILED RUN CHANGES NOTHING. Upstream down, throttled past the retries, or
 * a board under the sanity floor: nothing is written, the previous snapshot
 * (stored or bundled) keeps serving, and the response says why with a 502 so
 * the cron log shows it.
 *
 * Manual run: `GET /api/cron/rankings/` with `Authorization: Bearer $CRON_SECRET`.
 */
export const dynamic = "force-dynamic";
/** Sixteen calls with backoff room — a throttled run can take minutes. */
export const maxDuration = 300;

/**
 * Longer than a day so a single missed run doesn't drop the row, and past the
 * 7-day trust window in the readers so the row never outlives the check that
 * ignores it anyway.
 */
const STORE_TTL_S = 8 * 24 * 60 * 60;

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

  const token = process.env.PB_API_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "PB_API_TOKEN is unset" }, { status: 503 });
  }
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");

  let result: Awaited<ReturnType<typeof fetchWprSnapshot>>;
  try {
    result = await fetchWprSnapshot({
      token,
      base,
      bypassCache: true,
      log: (msg: string) => console.log(`[cron/rankings] ${msg}`),
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "refresh failed";
    console.error(`[cron/rankings] kept the previous snapshot: ${error}`);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }

  const { snapshot, upstreamCalls, cacheHits } = result;
  const stored = await writeStored(WPR_SNAPSHOT_KEY, WPR_SNAPSHOT_TAG, snapshot, STORE_TTL_S);
  if (!stored) {
    console.error("[cron/rankings] fetched the boards but could not write the snapshot row");
    return NextResponse.json({ ok: false, error: "snapshot write failed" }, { status: 502 });
  }

  /**
   * ⚠ THE WHOLE SITE, BECAUSE THE BOARDS REACH THE WHOLE SITE. Ranks render on
   * /rankings, /leaderboards, every athlete page, /athletes, /europe, the
   * homepage module, the news player rails and the score headshots. Route
   * handlers only MARK paths — each page regenerates lazily on its next visit —
   * so this is far lighter than the daily full rebuild the old route asked for.
   */
  revalidatePath("/", "layout");

  const summary = describeSnapshot(snapshot, upstreamCalls, cacheHits);
  console.log(`[cron/rankings] stored ${snapshot.generatedAt} — ${summary}`);
  return NextResponse.json({ ok: true, generatedAt: snapshot.generatedAt, summary });
}
