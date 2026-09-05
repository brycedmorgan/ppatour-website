import { NextResponse } from "next/server";

/**
 * Daily rebuild trigger — the refresh half of the WPR snapshot.
 *
 * ⚠ WHY A REBUILD AND NOT A CACHE PURGE. `/api/revalidate-athletes` already
 * runs daily and calls `revalidateTag`, and that is NOT what refreshes the
 * rankings — it is what this session spent an afternoon proving. A cron can
 * only INVALIDATE a cache; it cannot make an uncached fetch cached. The board
 * fetches were never landing in the Data Cache (measured 9/5: three consecutive
 * requests to the same athlete page each took 17-30s), so purging more often
 * made it worse, not better: every purge simply handed the next visitor a
 * ten-call board assembly.
 *
 * ⚠ AND A CRON CANNOT WRITE THE SNAPSHOT ITSELF. `lib/data/wpr-snapshot.json`
 * is read at render; a serverless filesystem is read-only and ephemeral, so
 * nothing running in this app can update it. The only thing that can is a
 * build. So the daily refresh is a deploy: this route pings a Vercel Deploy
 * Hook, `prebuild` re-runs `scripts/snapshot-rankings.mjs`, and the new build
 * ships fresh boards that cost zero calls to serve.
 *
 * SETUP (one-time, in Vercel):
 *   1. Project → Settings → Git → Deploy Hooks → create one on `main`.
 *   2. Save its URL as the `DEPLOY_HOOK_URL` environment variable (Production).
 *
 * ⚠ UNSET IS SAFE AND IS THE CURRENT STATE. With no `DEPLOY_HOOK_URL` this
 * route reports `configured: false` and triggers nothing. It cannot half-work.
 */
export const dynamic = "force-dynamic";

/**
 * True when the request carries a Bearer token matching a secret we hold.
 * ⚠ An UNSET secret must never authorise anything — mirrors the same guard in
 * /api/revalidate-athletes rather than inventing a second rule.
 */
function bearerMatches(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && !bearerMatches(request, secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook) {
    return NextResponse.json({
      ok: true,
      configured: false,
      note: "DEPLOY_HOOK_URL is unset — no rebuild triggered. See the docblock in this route.",
    });
  }

  try {
    const res = await fetch(hook, { method: "POST", cache: "no-store" });
    // ⚠ Report the upstream status rather than swallowing it. A deploy hook that
    // silently stops firing is how the snapshot goes stale without anyone
    // noticing — and the 7-day expiry in lib/rankings-api.ts is the backstop,
    // not the alarm.
    return NextResponse.json(
      { ok: res.ok, configured: true, status: res.status, at: new Date().toISOString() },
      { status: res.ok ? 200 : 502 },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, configured: true, error: err instanceof Error ? err.message : "hook failed" },
      { status: 502 },
    );
  }
}
