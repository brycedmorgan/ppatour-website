import { NextResponse } from "next/server";
import { runApiHealthCheck } from "@/lib/api-health";

/**
 * Hourly upstream-API watchdog. Invoked by the Vercel Cron in vercel.json;
 * posts to Slack only when something changes for the worse (or recovers). The
 * rules, thresholds and the reason this is a cron rather than an inline check
 * all live in lib/api-health.ts.
 *
 * ⚠ SAFE TO CALL BY HAND, AND YOU SHOULD AFTER CHANGING A THRESHOLD:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://www.ppatour.com/api/cron/api-health/
 * It returns the hourly buckets it read, so you can see the real numbers the
 * thresholds are being compared against without opening the dashboard.
 *
 * ⚠ `?dry=1` EVALUATES AND REPORTS WITHOUT POSTING TO SLACK. Use it when
 * tuning, so calibrating a threshold does not DM anybody a test alert.
 *
 * ⚠ THE TRAILING SLASH IS NOT OPTIONAL when calling this from outside.
 * `trailingSlash: true` answers the unslashed path with a 308, and the 8/20
 * Stripe webhook outage in this repo was exactly that — a caller that does not
 * follow redirects silently never reaching the handler for fifteen days.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  if (dry) {
    const { checkApiHealth } = await import("@/lib/api-health");
    const verdict = await checkApiHealth();
    return NextResponse.json({ ok: true, dry: true, posted: false, verdict });
  }

  const { posted, verdict } = await runApiHealthCheck();
  return NextResponse.json({
    ok: true,
    posted,
    // A broken verdict is still a 200: the cron ran, and it already alerted.
    // Returning a 5xx here would make Vercel retry and double-post.
    verdict,
    at: new Date().toISOString(),
  });
}
