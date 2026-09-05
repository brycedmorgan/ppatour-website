import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";

/**
 * Daily cache refresh for the athlete pages. Invoked by the Vercel Cron in
 * vercel.json: invalidates the athlete API fetch tag (stats, DUPR, highlights)
 * so the next request re-pulls fresh data. Between refreshes those calls are
 * served from the Data Cache, so page renders and builds don't re-hit — and
 * never trip — the partner API's rate limit.
 *
 * ⚠ THIS DELIBERATELY NO LONGER TOUCHES THE RANKING BOARDS (9/5). They now
 * carry their own RANKINGS_CACHE_TAG. Because the SECOND caller below is
 * Jackalope on every player save, purging one shared tag meant a single paddle
 * edit dropped all ten cached WPR board pages plus the six division boards, and
 * the next render of any athlete page, news article, /athletes or /europe had to
 * re-page both boards from upstream. That is a thundering herd per save, and a
 * bulk import (the 24 Europe portraits, 9/4) is two dozen of them back to back.
 * A player record changing does not change the rankings. The boards roll
 * themselves over daily via their `rank=<today>` URL, so nothing has to purge
 * them on a schedule.
 *
 * If CRON_SECRET is set, we require Vercel's `Authorization: Bearer <secret>`.
 *
 * SECOND CALLER (8/23): Jackalope, on save.
 *
 * The daily cron alone means a Pro Player Central edit — a paddle, a hero photo, a pro's
 * social links — is invisible here for up to 24 hours, averaging about twelve. Three
 * comments in this repo used to claim five minutes; they were wrong, and the reason is
 * written up at the ⚠ FRESHNESS block in `lib/player-overrides.ts`. Jackalope now calls
 * this route when a player record is saved, so an edit lands in seconds.
 *
 * It authenticates with its OWN secret, `REVALIDATE_HOOK_SECRET`, NOT with CRON_SECRET.
 * Two reasons: CRON_SECRET is Vercel's cron credential and should not be copied into a
 * second application, and a separate secret can be rotated to cut Jackalope off without
 * breaking the cron.
 *
 * ⚠ UNSET IS THE SAFE DEFAULT AND THE CURRENT STATE. With no REVALIDATE_HOOK_SECRET this
 * route behaves exactly as before — the branch below can never match, because an unset
 * secret is never compared against. Setting it in both projects is what switches the
 * webhook on; nothing here needs to change again.
 */
export const dynamic = "force-dynamic";

/**
 * True when the request carries a Bearer token matching a secret we actually hold.
 * ⚠ An UNSET secret must never authorise anything — `!secret` returns false rather than
 * falling through to a `"Bearer undefined"` comparison.
 */
function bearerMatches(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized =
    bearerMatches(request, secret) ||
    bearerMatches(request, process.env.REVALIDATE_HOOK_SECRET);
  if (secret && !authorized) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // "max" → stale-while-revalidate: serve cached data on the next visit while
  // the fresh player data is fetched in the background.
  revalidateTag(ATHLETES_CACHE_TAG, "max");

  return NextResponse.json({
    ok: true,
    revalidated: ATHLETES_CACHE_TAG,
    at: new Date().toISOString(),
  });
}
